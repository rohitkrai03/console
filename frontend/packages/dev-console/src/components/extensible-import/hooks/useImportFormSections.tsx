import { LoadedExtension, useExtensions } from '@console/plugin-sdk';
import * as React from 'react';
import {
  ImportSection,
  ImportSectionBinding,
  isImportSection,
  isImportSectionBinding,
} from '../../../extensions/import-forms';

const useImportFormSections = (formId) => {
  const formSectionExtensions = useExtensions<ImportSection>(isImportSection);
  const sectionBindingExtensions = useExtensions<ImportSectionBinding>(isImportSectionBinding);
  const [importFormSections, setImportFormSections] = React.useState<
    LoadedExtension<ImportSection>[]
  >([]);

  React.useEffect(() => {
    const gitFormSectionBindings = sectionBindingExtensions.filter((e) =>
      e.properties.form.includes(formId),
    );

    const formSections = formSectionExtensions.filter((formSectionExtension) =>
      gitFormSectionBindings.find(
        (sectionBinding) =>
          sectionBinding.properties.sectionId === formSectionExtension.properties.id,
      ),
    );
    setImportFormSections(formSections);
  }, [formId, formSectionExtensions, sectionBindingExtensions]);

  return importFormSections;
};

export default useImportFormSections;
