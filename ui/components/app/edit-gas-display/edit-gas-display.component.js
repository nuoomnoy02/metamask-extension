import React, { useState, useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import Typography from '../../ui/typography/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  TEXT_ALIGN,
} from '../../../helpers/constants/design-system';

import InfoTooltip from '../../ui/info-tooltip';
import TransactionTotalBanner from '../transaction-total-banner/transaction-total-banner.component';
import RadioGroup from '../../ui/radio-group/radio-group.component';
import AdvancedGasControls from '../advanced-gas-controls/advanced-gas-controls.component';

import { I18nContext } from '../../../contexts/i18n';
import ActionableMessage from '../../../pages/swaps/actionable-message';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';

import { getShouldShowFiat } from '../../../selectors';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { SECONDARY } from '../../../helpers/constants/common';
import { decGWEIToHexWEI } from '../../../helpers/utils/conversions.util';

export default function EditGasDisplay({
  alwaysShowForm,
  type,
  showEducationButton,
  onEducationClick,
}) {
  const t = useContext(I18nContext);

  const { isGasEstimatesLoading, gasFeeEstimates } = useGasFeeEstimates();

  const [warning] = useState(null);
  const [error, setError] = useState(null);

  const [showAdvancedForm, setShowAdvancedForm] = useState(false);
  const [estimateToUse, setEstimateToUse] = useState('high');

  const [maxPriorityFee, setMaxPriorityFee] = useState(
    gasFeeEstimates?.[estimateToUse]?.suggestedMaxPriorityFeePerGas,
  );
  const [maxFee, setMaxFee] = useState(
    gasFeeEstimates?.[estimateToUse]?.suggestedMaxFeePerGas,
  );
  const [maxPriorityFeeError, setMaxPriorityFeeError] = useState(null);
  const [maxFeeError, setMaxFeeError] = useState(null);

  const [gasLimit, setGasLimit] = useState(21000);
  const [gasPrice, setGasPrice] = useState(0);

  const prevIsGasEstimatesLoading = useRef(true);
  useEffect(() => {
    if (
      prevIsGasEstimatesLoading.current === true &&
      isGasEstimatesLoading === false &&
      estimateToUse
    ) {
      setMaxPriorityFee(
        gasFeeEstimates?.[estimateToUse]?.suggestedMaxPriorityFeePerGas,
      );
      setMaxFee(gasFeeEstimates?.[estimateToUse]?.suggestedMaxFeePerGas);
    }
  }, [isGasEstimatesLoading, estimateToUse, gasFeeEstimates]);

  // Validation for the maxPriorityFee and maxFee fields
  useEffect(() => {
    const isMaxPriorityFeeError =
      !isGasEstimatesLoading &&
      maxPriorityFee < gasFeeEstimates?.low?.suggestedMaxPriorityFeePerGas;
    const isMaxFeeError =
      !isGasEstimatesLoading &&
      maxFee < gasFeeEstimates?.low?.suggestedMaxFeePerGas;

    setMaxPriorityFeeError(
      isMaxPriorityFeeError ? t('editGasMaxPriorityFeeLow') : null,
    );
    setMaxFeeError(isMaxFeeError ? t('editGasMaxFeeLow') : null);
    setError(
      isMaxPriorityFeeError || isMaxFeeError ? t('editGasTooLow') : null,
    );
  }, [maxPriorityFee, gasFeeEstimates, maxFee, isGasEstimatesLoading, t]);

  const { currency, numberOfDecimals } = useUserPreferencedCurrency(SECONDARY);
  const showFiat = useSelector(getShouldShowFiat);

  const [, maxPriorityParts] = useCurrencyDisplay(
    decGWEIToHexWEI(maxPriorityFee * gasLimit),
    {
      numberOfDecimals,
      currency,
    },
  );
  const maxPriorityFeeFiat = showFiat ? maxPriorityParts.value : '';

  const [, maxFeeParts] = useCurrencyDisplay(
    decGWEIToHexWEI(maxFee * gasLimit),
    {
      numberOfDecimals,
      currency,
    },
  );
  const maxFeeFiat = showFiat ? maxFeeParts.value : '';

  return (
    <div className="edit-gas-display">
      <div className="edit-gas-display__content">
        {warning && (
          <div className="edit-gas-display__warning">
            <ActionableMessage
              className="actionable-message--warning"
              message={warning}
            />
          </div>
        )}
        {type === 'speed-up' && (
          <div className="edit-gas-display__top-tooltip">
            <Typography
              color={COLORS.BLACK}
              variant={TYPOGRAPHY.H8}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('speedUpTooltipText')}{' '}
              <InfoTooltip
                position="top"
                contentText={t('speedUpExplanation')}
              />
            </Typography>
          </div>
        )}
        <TransactionTotalBanner total={maxFeeFiat} detail="" timing="" />
        {error && (
          <div className="edit-gas-display__error">
            <Typography
              color={COLORS.ERROR1}
              variant={TYPOGRAPHY.H7}
              align={TEXT_ALIGN.CENTER}
            >
              {t('editGasTooLow')}
            </Typography>
          </div>
        )}
        <RadioGroup
          name="gas-recommendation"
          options={[
            { value: 'low', label: t('editGasLow'), recommended: false },
            { value: 'medium', label: t('editGasMedium'), recommended: false },
            { value: 'high', label: t('editGasHigh'), recommended: false },
          ]}
          selectedValue={estimateToUse}
          onChange={(value) => {
            setEstimateToUse(value);
            setMaxPriorityFee(
              gasFeeEstimates?.[value]?.suggestedMaxPriorityFeePerGas,
            );
            setMaxFee(gasFeeEstimates?.[value]?.suggestedMaxFeePerGas);
          }}
        />
        {!alwaysShowForm && (
          <button
            className="edit-gas-display__advanced-button"
            onClick={() => setShowAdvancedForm(!showAdvancedForm)}
          >
            {t('advancedOptions')}{' '}
            {showAdvancedForm ? (
              <i className="fa fa-caret-up"></i>
            ) : (
              <i className="fa fa-caret-down"></i>
            )}
          </button>
        )}
        {(alwaysShowForm || showAdvancedForm) && (
          <AdvancedGasControls
            gasFeeEstimates={gasFeeEstimates}
            estimateToUse={estimateToUse}
            isGasEstimatesLoading={isGasEstimatesLoading}
            onManualChange={() => {
              setEstimateToUse(undefined);
            }}
            gasLimit={gasLimit}
            setGasLimit={setGasLimit}
            maxPriorityFee={maxPriorityFee}
            setMaxPriorityFee={setMaxPriorityFee}
            maxFee={maxFee}
            setMaxFee={setMaxFee}
            gasPrice={gasPrice}
            setGasPrice={setGasPrice}
            maxPriorityFeeFiat={maxPriorityFeeFiat}
            maxFeeFiat={maxFeeFiat}
            maxPriorityFeeError={maxPriorityFeeError}
            maxFeeError={maxFeeError}
          />
        )}
      </div>
      {showEducationButton && (
        <div className="edit-gas-display__education">
          <button onClick={onEducationClick}>
            {t('editGasEducationButtonText')}
          </button>
        </div>
      )}
    </div>
  );
}

EditGasDisplay.propTypes = {
  alwaysShowForm: PropTypes.bool,
  type: PropTypes.oneOf(['customize-gas', 'speed-up']),
  showEducationButton: PropTypes.bool,
  onEducationClick: PropTypes.func,
};

EditGasDisplay.defaultProps = {
  alwaysShowForm: false,
  type: 'customize-gas',
  showEducationButton: false,
  onEducationClick: undefined,
};
