import * as _ from 'lodash';
import * as React from 'react';

import { RowFunction } from '@console/internal/components/factory';
import { Kebab, KebabOption } from '@console/internal/components/utils';

import { NicSimpleRow } from '../../../vm-nics/nic-row';
import { VMWizardNetwork } from '../../types';
import { VMWizardNetworkBundle, VMWizardNicRowActionOpts, VMWizardNicRowCustomData } from './types';
import { vmWizardNicModalEnhanced } from './vm-wizard-nic-modal-enhanced';

const menuActionEdit = (
  network: VMWizardNetwork,
  { wizardReduxID, withProgress, isUpdateDisabled }: VMWizardNicRowActionOpts,
): KebabOption => ({
  label: 'Edit',
  isDisabled: !!isUpdateDisabled,
  callback: () =>
    withProgress(
      vmWizardNicModalEnhanced({
        blocking: true,
        isEditing: true,
        wizardReduxID,
        network,
      }).result,
    ),
});

const menuActionRemove = (
  { id }: VMWizardNetwork,
  { withProgress, removeNIC, isDeleteDisabled }: VMWizardNicRowActionOpts,
): KebabOption => ({
  label: 'Delete',
  isDisabled: !!isDeleteDisabled,
  callback: () =>
    withProgress(
      new Promise((resolve) => {
        removeNIC(id);
        resolve();
      }),
    ),
});

const getActions = (wizardNetworkData: VMWizardNetwork, opts: VMWizardNicRowActionOpts) => {
  const actions = [menuActionEdit, menuActionRemove];
  return actions.map((a) => a(wizardNetworkData, opts));
};

export const VMWizardNicRow: RowFunction<VMWizardNetworkBundle, VMWizardNicRowCustomData> = ({
  obj: { name, wizardNetworkData, ...restData },
  customData: {
    isDisabled,
    isDeleteDisabled,
    isUpdateDisabled,
    columnClasses,
    removeNIC,
    withProgress,
    wizardReduxID,
  },
  index,
  style,
}) => {
  return (
    <NicSimpleRow
      data={{ ...restData, name }}
      validation={_.get(wizardNetworkData, ['validation', 'validations'])}
      columnClasses={columnClasses}
      index={index}
      style={style}
      actionsComponent={
        <Kebab
          options={getActions(wizardNetworkData, {
            wizardReduxID,
            isDeleteDisabled,
            isUpdateDisabled,
            removeNIC,
            withProgress,
          })}
          isDisabled={isDisabled}
          id={`kebab-for-${name}`}
        />
      }
    />
  );
};
