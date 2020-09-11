import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import { LoadingBox } from '@console/internal/components/utils';
import useImportFormSections from './hooks/useImportFormSections';

const GitForm: React.FC<FormikProps<FormikValues>> = () => {
  const formSectionExtensions = useImportFormSections('git');

  const [FormSections, setFormSections] = React.useState<
    React.LazyExoticComponent<React.ComponentType<any>>[]
  >([]);

  React.useEffect(() => {
    const formSections = formSectionExtensions.map((section) =>
      React.lazy(section.properties.component),
    );
    setFormSections(formSections);
  }, [formSectionExtensions]);

  return (
    <React.Suspense fallback={<LoadingBox />}>
      {FormSections.map((Section, index) => (
        <Section key={formSectionExtensions[index].uid} />
      ))}
    </React.Suspense>
  );
};

export default GitForm;
