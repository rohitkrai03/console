import { Plugin } from '@console/plugin-sdk';
import {
  ImportSection,
  ImportSectionBinding,
  ImportResourceType,
  ImportResourceTypeBinding,
} from '../../extensions/import-forms';
import { Resources } from '../import/import-types';
import { DeploymentModel, DeploymentConfigModel } from '@console/internal/models';
import {
  GitSectionLoader,
  getGitSectionInitialValues,
  getGitSectionValidationSchema,
} from './loaders';

export type ImportFormsConsumedExtensions =
  | ImportSection
  | ImportSectionBinding
  | ImportResourceType
  | ImportResourceTypeBinding;

export const importFormsPlugin: Plugin<ImportFormsConsumedExtensions> = [
  {
    type: 'Import/ResourceType',
    properties: {
      id: Resources.Kubernetes,
      model: {
        kind: DeploymentModel.kind,
        version: DeploymentModel.apiVersion,
        group: DeploymentModel.apiGroup,
      },
      description: `A ${DeploymentModel.label} enables declarative updates for Pods and ReplicaSets.`,
    },
  },
  {
    type: 'Import/ResourceTypeBinding',
    properties: {
      form: ['git'],
      resourceTypeId: Resources.Kubernetes,
    },
  },
  {
    type: 'Import/ResourceType',
    properties: {
      id: Resources.OpenShift,
      model: {
        kind: DeploymentConfigModel.kind,
        version: DeploymentConfigModel.apiVersion,
        group: DeploymentConfigModel.apiGroup,
      },
      description: `A ${DeploymentConfigModel.label} defines the template for a pod and manages deploying new images or configuration changes.`,
    },
  },
  {
    type: 'Import/ResourceTypeBinding',
    properties: {
      form: ['git'],
      resourceTypeId: Resources.OpenShift,
    },
  },
  {
    type: 'Import/Section',
    properties: {
      id: 'git',
      component: GitSectionLoader,
      initialValues: getGitSectionInitialValues,
      validationSchema: getGitSectionValidationSchema,
    },
  },
  {
    type: 'Import/SectionBinding',
    properties: {
      form: ['git'],
      sectionId: 'git',
    },
  },
];
