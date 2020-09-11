import * as React from 'react';
import Helmet from 'react-helmet';
import * as yup from 'yup';
import { RouteComponentProps } from 'react-router';
import { Formik, FormikProps, FormikValues } from 'formik';
import {
  PageHeading,
  history,
  LoadingBox,
  getQueryArgument,
} from '@console/internal/components/utils';
import { PageBody } from '@console/shared';
import { QUERY_PROPERTIES } from '../../const';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import { Resources } from '../import/import-types';
import GitForm from './GitForm';
import useImportFormSections from './hooks/useImportFormSections';

export type GitFormikProps = RouteComponentProps<{ ns?: string }>;

const GitFormik: React.FC<GitFormikProps> = () => {
  const contextualSource = getQueryArgument(QUERY_PROPERTIES.CONTEXT_SOURCE);
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const formSections = useImportFormSections('git');

  const initialValues = React.useRef({
    resource: {
      type: Resources.Kubernetes,
      blacklist: contextualSource ? [Resources.KnativeService] : [],
    },
  });

  const validationSchema = React.useRef({});

  React.useEffect(() => {
    formSections.forEach(async (section, index) => {
      const values = await section.properties.initialValues();
      const schema = await section.properties.validationSchema();
      initialValues.current[section.properties.id] = values;
      validationSchema.current[section.properties.id] = schema;
      if (index === formSections.length - 1) setLoaded(true);
    });
  }, [formSections]);

  if (!loaded) return <LoadingBox />;

  const yupSchema = yup.object().shape(validationSchema.current);

  const handleSubmit = () => {};

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>Import from git</title>
      </Helmet>
      <PageHeading title="Import from git" />
      <PageBody>
        <Formik
          initialValues={initialValues.current}
          validationSchema={yupSchema}
          onSubmit={handleSubmit}
          onReset={history.goBack}
        >
          {(formikProps: FormikProps<FormikValues>) => <GitForm {...formikProps} />}
        </Formik>
      </PageBody>
    </NamespacedPage>
  );
};

export default GitFormik;
