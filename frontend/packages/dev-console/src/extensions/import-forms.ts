import { ComponentType } from 'react';
import * as Yup from 'yup';
import { CodeRef, Extension } from '@console/plugin-sdk/src/typings/base';
import { K8sResourceKind } from '@console/internal/module/k8s';

type ReactLazyLoader = () => Promise<{ default: ComponentType<any> }>;

namespace ExtensionProperties {
  export interface ImportFormSection {
    /** ID used to identify the section. */
    id: string;
    /** Component to render for the section. */
    component: ReactLazyLoader;
    /** The initial values of the form contributed by this section. */
    initialValues?: CodeRef<{ [key: string]: any }>;
    /** Yup validation schema that validates valus specific to this section. */
    validationSchema?: CodeRef<Yup>;
  }

  export interface ImportFormSectionMapper {
    /** Forms that the section is contributed to */
    form: string[];
    /** Section id to map section to the forms */
    sectionId: string;
    /** The resourceTypeId that the section should be exclusive to */
    resourceTypeId?: string;
    /** Define if the section should be rendered as advanced options in the forms. Also the title of the advanced option. */
    advanced?: string;
    /** Insert this section before the section referenced here */
    insertBefore?: string;
    /** Handle actions specific to the section during submission of the form in addition to default submit actions. */
    submitHandler?: CodeRef<(data: any, dryRun: boolean) => Promise<K8sResourceKind[]>>;
  }

  export interface ImportResourceType {
    /** ID used to identify the resource type. */
    id: string;
    /** Model of the resource that defines group, version and kind */
    model: {
      group: string;
      version: string;
      kind: string;
    };
    /** Description of the resource type */
    description?: string;
  }

  export interface ImportResourceTypeMapper {
    /** Forms that the resource type is contributed to */
    form: string[];
    /** Resource Type Id to map the resource type to the forms */
    resourceTypeId: string;
    /** Insert this resource type before the resource type referenced here */
    insertBefore?: string;
    /** Handle default actions during submission of the form for this resource type. */
    submitHandler?: CodeRef<(data: any, dryRun: boolean) => Promise<K8sResourceKind[]>>;
  }
}

export interface ImportFormSection extends Extension<ExtensionProperties.ImportFormSection> {
  type: 'Import/FormSection';
}

export interface ImportFormSectionMapper
  extends Extension<ExtensionProperties.ImportFormSectionMapper> {
  type: 'Import/FormSectionMapper';
}

export interface ImportResourceType extends Extension<ExtensionProperties.ImportResourceType> {
  type: 'Import/ResourceType';
}

export interface ImportResourceTypeMapper
  extends Extension<ExtensionProperties.ImportResourceTypeMapper> {
  type: 'Import/ResourceTypeMapper';
}

export const isImportFormSection = (e: Extension): e is ImportFormSection => {
  return e.type === 'Import/FormSection';
};

export const isImportFormSectionMapper = (e: Extension): e is ImportFormSectionMapper => {
  return e.type === 'Import/FormSectionMapper';
};

export const isImportResourceType = (e: Extension): e is ImportResourceType => {
  return e.type === 'Import/ResourceType';
};

export const isImportResourceTypeMapper = (e: Extension): e is ImportResourceTypeMapper => {
  return e.type === 'Import/ResourceTypeMapper';
};
