import { Controller, useWatch, type UseFormReturn } from 'react-hook-form';
import styled from 'styled-components';
import { Button, Notice, OptionGroup, TextField } from '@components';
import { contractEndDate, formatDateWithYear } from '@lib/dates';
import { media } from '@styles/theme';
import { StepFooter, StepIntro } from '../components/stepStyles';

export type ContractValues = {
  contract_type: 'trial' | 'formal';
  duration: '6' | '12' | '24';
  start_date: string;
  rent_amount: string;
  fixed_due_day: string;
  has_deposit: boolean;
  deposit_amount: string;
};

export const EMPTY_CONTRACT: ContractValues = {
  contract_type: 'formal',
  duration: '12',
  start_date: '',
  rent_amount: '',
  fixed_due_day: '',
  has_deposit: false,
  deposit_amount: '',
};

/** "9,000.50" → 9000.5; vacío o inválido → NaN. Solo convierte lo escrito; no calcula. */
export const toAmount = (value: string) => {
  const clean = value.replace(/,/g, '').trim();
  return /^\d+(\.\d{1,2})?$/.test(clean) ? Number(clean) : NaN;
};

export const durationOf = (values: ContractValues) =>
  values.contract_type === 'trial' ? 6 : Number(values.duration);

/** La prueba siempre lleva depósito; el formal preexistente puede no tenerlo (C-18). */
export const depositRequired = (values: ContractValues) =>
  values.contract_type === 'trial' || values.has_deposit;

const Grid = styled.div`
  display: grid;
  gap: 20px;

  ${media.desktop} {
    grid-template-columns: 1fr 1fr;
    column-gap: 16px;
  }
`;

const Hint = styled.p`
  margin: 6px 0 0;
  font-size: 13px;
  color: ${({ theme }) => theme.color.neutral600};
`;

const Check = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 40px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  input {
    width: 20px;
    height: 20px;
    accent-color: ${({ theme }) => theme.color.primary600};
  }

  small {
    font-weight: 400;
    color: ${({ theme }) => theme.color.neutral600};
  }
`;

type ContractFieldsProps = {
  form: UseFormReturn<ContractValues>;
  failure: { title: string; body?: string; tone: 'error' | 'uncertain'; requestId?: string } | null;
  reviewing: boolean;
  onReview: () => void;
};

/**
 * P-10 · Contrato (C-18): fechas y condiciones reales. Duraciones de la Guía: prueba de 6 meses;
 * formal de 6, 12 o 24. El estado (Activo o Vencido) y los cobros los da la revisión del servidor.
 */
export function ContractFields({ form, failure, reviewing, onReview }: ContractFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const values = useWatch({ control }) as ContractValues;
  const trial = values.contract_type === 'trial';
  const end = /^\d{4}-\d{2}-\d{2}$/.test(values.start_date ?? '')
    ? contractEndDate(values.start_date, durationOf(values))
    : null;

  return (
    <>
      <StepIntro>
        <h2>Datos del contrato que ya tiene</h2>
        <p>Escribe las fechas y condiciones reales.</p>
      </StepIntro>
      {failure ? (
        <Notice tone={failure.tone} title={failure.title} requestId={failure.requestId}>
          {failure.body}
        </Notice>
      ) : null}
      <Controller
        control={control}
        name="contract_type"
        render={({ field }) => (
          <OptionGroup
            label="Tipo de contrato"
            value={field.value}
            options={[
              { value: 'trial', label: 'Prueba · 6 meses' },
              { value: 'formal', label: 'Formal' },
            ]}
            onChange={field.onChange}
          />
        )}
      />
      {trial ? null : (
        <Controller
          control={control}
          name="duration"
          render={({ field }) => (
            <OptionGroup
              label="Duración"
              value={field.value}
              options={[
                { value: '6', label: '6 meses' },
                { value: '12', label: '12 meses' },
                { value: '24', label: '24 meses' },
              ]}
              onChange={field.onChange}
            />
          )}
        />
      )}
      <Grid>
        <div>
          <TextField
            label="Fecha de inicio"
            type="date"
            disabled={reviewing}
            error={errors.start_date?.message}
            {...register('start_date', {
              validate: value => Boolean(value) || 'Escribe la fecha de inicio.',
            })}
          />
          {end ? <Hint>Termina el {formatDateWithYear(end)}.</Hint> : null}
        </div>
        <TextField
          label="Renta mensual"
          format="money"
          prefix="$"
          autoComplete="off"
          disabled={reviewing}
          error={errors.rent_amount?.message}
          {...register('rent_amount', {
            validate: value => toAmount(value) > 0 || 'Escribe la renta mensual.',
          })}
        />
        <TextField
          label="Día de pago"
          help="Día del mes en que vence la renta"
          inputMode="numeric"
          maxLength={2}
          autoComplete="off"
          disabled={reviewing}
          error={errors.fixed_due_day?.message}
          {...register('fixed_due_day', {
            validate: value =>
              (/^\d{1,2}$/.test(value.trim()) && Number(value) >= 1 && Number(value) <= 31) ||
              'Escribe un día del 1 al 31.',
          })}
        />
      </Grid>
      {trial ? (
        <Hint as="p">Un contrato de prueba siempre lleva depósito.</Hint>
      ) : (
        <Check>
          <input type="checkbox" disabled={reviewing} {...register('has_deposit')} />
          <span>
            Agregar depósito anterior <small>· Opcional</small>
          </span>
        </Check>
      )}
      {depositRequired(values) ? (
        <TextField
          label="Importe del depósito"
          format="money"
          prefix="$"
          autoComplete="off"
          help="Se registrará como Pendiente. Después podrás registrar su pago si ya fue recibido."
          disabled={reviewing}
          error={errors.deposit_amount?.message}
          {...register('deposit_amount', {
            validate: (value, all) =>
              !depositRequired(all) || toAmount(value) > 0 || 'Escribe el importe del depósito.',
          })}
        />
      ) : null}
      <StepFooter>
        <Button onClick={onReview} loading={reviewing} loadingLabel="Revisando…">
          Revisar renta actual
        </Button>
      </StepFooter>
    </>
  );
}
