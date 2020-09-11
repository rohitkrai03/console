import * as React from 'react';
import FormSection from '../import/section/FormSection';
import { InputField } from '@console/shared';
import { TextInputTypes } from '@patternfly/react-core';

const GitSection: React.FC = () => {
  return (
    <FormSection title="Git">
      <InputField
        type={TextInputTypes.text}
        name="git.url"
        label="Git Repo URL"
        helpText="Some help text"
        helpTextInvalid="Some valid help text"
        required
      />
    </FormSection>
  );
};

export default GitSection;
