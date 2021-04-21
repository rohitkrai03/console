import * as _ from 'lodash';
import { ContainerSpec, EnvVar, K8sResourceKind } from '@console/internal/module/k8s';
import { getTriggerAnnotation } from '../../../utils/resource-label-utils';
import {
  checkIfTriggerExists,
  getResourcesType,
} from '../../edit-application/edit-application-utils';
import { ImageStreamImageData, Resources } from '../../import/import-types';
import {
  DeploymentStrategyType,
  FailurePolicyType,
  LifecycleAction,
} from '../deployment-strategy/utils/types';
import {
  DeploymentStrategy,
  EditDeploymentFormData,
  LifecycleHookData,
  LifecycleHookFormData,
  LifecycleHookImagestreamData,
} from './edit-deployment-types';

export const getContainerNames = (containers: ContainerSpec[]) => {
  return (
    containers?.reduce((acc, container) => {
      return {
        ...acc,
        [container.name]: container.name,
      };
    }, {}) ?? []
  );
};

export const getLchImageStreamData = (
  resName: string,
  resNamespace: string,
  tagImages?: { containerName: string; to: { [key: string]: string } }[],
): LifecycleHookImagestreamData => {
  const imageTagNs = tagImages?.[0]?.to?.namespace ?? '';
  const image = tagImages?.[0]?.to?.name?.split(':') ?? [];
  return {
    name: resName,
    project: { name: resNamespace },
    fromImageStreamTag: true,
    imageStreamTag: {},
    containerName: tagImages?.[0]?.containerName ?? '',
    to: tagImages?.[0]?.to ?? {},
    isSearchingForImage: false,
    imageStream: {
      namespace: imageTagNs || resNamespace,
      image: image[0] ?? '',
      tag: image[1] ?? '',
    },
    isi: {
      name: '',
      image: {},
      tag: '',
      status: { metadata: {}, status: '' },
      ports: [],
    },
    image: {
      name: '',
      image: {},
      tag: '',
      status: { metadata: {}, status: '' },
      ports: [],
    },
  };
};

export const getLifecycleHookData = (lch: any): LifecycleHookData => {
  return {
    failurePolicy: lch?.failurePolicy ?? FailurePolicyType.Abort,
    execNewPod: {
      command: lch?.execNewPod?.command,
      containerName: lch?.execNewPod?.containerName,
      env: lch?.execNewPod?.env,
      volumes: _.join(lch?.execNewPod?.volumes, ','),
    },
    tagImages: lch?.tagImages ?? [],
  };
};

export const getLifecycleHookFormData = (lch: any): LifecycleHookFormData => {
  return {
    lch: getLifecycleHookData(lch),
    exists: !!lch,
    isAddingLch: false,
    action: lch
      ? lch.hasOwnProperty(LifecycleAction.execNewPod)
        ? LifecycleAction.execNewPod
        : LifecycleAction.tagImages
      : LifecycleAction.execNewPod,
  };
};

export const getStrategyData = (
  type: string,
  strategy: any,
  resName: string,
  resNamespace: string,
) => {
  switch (type) {
    case DeploymentStrategyType.recreateParams: {
      const { mid: midHook, post: postHook, pre: preHook, timeoutSeconds } =
        strategy.recreateParams ?? {};
      return {
        recreateParams: {
          timeoutSeconds,
          pre: getLifecycleHookFormData(preHook),
          mid: getLifecycleHookFormData(midHook),
          post: getLifecycleHookFormData(postHook),
        },
        imageStreamData: {
          pre: getLchImageStreamData(resName, resNamespace, preHook?.tagImages),
          mid: getLchImageStreamData(resName, resNamespace, midHook?.tagImages),
          post: getLchImageStreamData(resName, resNamespace, postHook?.tagImages),
        },
      };
    }
    case DeploymentStrategyType.customParams: {
      const { command, environment, image } = strategy.customParams ?? {};
      return {
        customParams: {
          command,
          environment,
          image,
        },
      };
    }
    case DeploymentStrategyType.rollingParams: {
      const {
        post: postHook,
        pre: preHook,
        timeoutSeconds,
        updatePeriodSeconds,
        intervalSeconds,
        maxSurge,
        maxUnavailable,
      } = strategy.rollingParams ?? {};
      return {
        rollingParams: {
          timeoutSeconds,
          pre: getLifecycleHookFormData(preHook),
          post: getLifecycleHookFormData(postHook),
          updatePeriodSeconds,
          intervalSeconds,
          maxSurge,
          maxUnavailable,
        },
        imageStreamData: {
          pre: getLchImageStreamData(resName, resNamespace, preHook?.tagImages),
          post: getLchImageStreamData(resName, resNamespace, postHook?.tagImages),
        },
      };
    }
    case DeploymentStrategyType.rollingUpdate: {
      const { maxSurge, maxUnavailable } = strategy.rollingUpdate ?? {};
      return { rollingUpdate: { maxSurge, maxUnavailable } };
    }
    default:
      return {};
  }
};

export const getStrategy = (
  deployment: K8sResourceKind,
  resourceType: string,
): DeploymentStrategy => {
  const { strategy } = deployment.spec ?? {};
  let type: string;

  if (resourceType === Resources.OpenShift) {
    type = strategy?.type ?? DeploymentStrategyType.rollingParams;
    return {
      ...(_.omit(strategy, ['rollingParams', 'recreateParams', 'customParams']) ?? {}),
      type,
      ...getStrategyData(type, strategy, deployment.metadata.name, deployment.metadata.namespace),
    };
  }

  type = strategy?.type ?? DeploymentStrategyType.rollingUpdate;
  return {
    type,
    ...(type === DeploymentStrategyType.rollingUpdate
      ? getStrategyData(type, strategy, deployment.metadata.name, deployment.metadata.namespace)
      : {}),
  };
};

export const getTriggersAndImageStreamValues = (
  deployment: K8sResourceKind,
  resourceType: string,
) => {
  let imageName: string;
  let imageTrigger;
  const data = {
    isSearchingForImage: false,
    imageStream: {
      image: '',
      tag: '',
      namespace: '',
    },
    isi: {
      name: '',
      image: {},
      tag: '',
      status: { metadata: {}, status: '' },
      ports: [],
    },
    image: {
      name: '',
      image: {},
      tag: '',
      status: { metadata: {}, status: '' },
      ports: [],
    },
  };

  if (resourceType === Resources.OpenShift) {
    const triggers = deployment?.spec?.triggers;
    imageTrigger = _.find(triggers, (trigger) => trigger.type === 'ImageChange');
    imageName = imageTrigger?.imageChangeParams.from.name.split(':') ?? [];
    return {
      ...data,
      triggers: {
        image: checkIfTriggerExists(triggers, 'ImageChange', deployment.kind),
        config: checkIfTriggerExists(triggers, 'ConfigChange'),
      },
      fromImageStreamTag: !!imageTrigger,
      imageStream: {
        image: imageName[0] ?? '',
        tag: imageName[1] ?? '',
        namespace: imageTrigger?.imageChangeParams.from.namespace ?? '',
      },
    };
  }

  imageTrigger = JSON.parse(
    deployment?.metadata?.annotations?.['image.openshift.io/triggers'] ?? '[]',
  )?.[0];
  imageName = imageTrigger?.from?.name?.split(':') ?? [];
  return {
    ...data,
    triggers: {
      image: imageTrigger?.pause === 'false',
    },
    fromImageStreamTag: !!imageTrigger,
    imageStream: {
      image: imageName[0] ?? '',
      tag: imageName[1] ?? '',
      namespace: imageTrigger?.from?.namespace ?? '',
    },
  };
};

export const convertDeploymentToEditForm = (
  deployment: K8sResourceKind,
): EditDeploymentFormData => {
  const resourceType = getResourcesType(deployment);
  return {
    name: deployment.metadata.name,
    project: {
      name: deployment.metadata.namespace,
    },
    resourceVersion: deployment.metadata.resourceVersion,
    deploymentStrategy: getStrategy(deployment, resourceType),
    containers: deployment.spec.template?.spec?.containers ?? [],
    imageName: deployment.spec.template?.spec?.containers?.[0]?.image,
    envs: deployment.spec.template?.spec?.containers?.[0]?.env,
    imagePullSecret: deployment.spec.template?.spec?.imagePullSecrets?.[0]?.name,
    paused: deployment.spec.paused ?? false,
    replicas: deployment.spec.replicas,
    ...getTriggersAndImageStreamValues(deployment, resourceType),
  };
};

export const getUpdatedContainers = (
  containers: ContainerSpec[],
  fromImageStreamTag: boolean,
  isi: ImageStreamImageData,
  imageName?: string,
  envs?: EnvVar[],
) => {
  const { image } = isi;
  const newContainers: ContainerSpec[] = containers;
  const imageRef = fromImageStreamTag && !_.isEmpty(image) ? image.dockerImageReference : imageName;
  newContainers[0] = {
    ...newContainers[0],
    image: imageRef,
    env: envs,
  };
  return newContainers;
};

export const getUpdatedLchData = (
  lch: LifecycleHookData,
  lchName: string,
  lcAction: string,
  imageStreamData: LifecycleHookImagestreamData,
) => {
  const getUpdatedTagImages = () => {
    const { containerName, to, imageStreamTag } = imageStreamData;
    const { apiVersion, kind, metadata } = imageStreamTag;
    lch.tagImages[0] = {
      containerName,
      to: !_.isEmpty(to)
        ? to
        : {
            apiVersion,
            kind,
            name: metadata?.name,
            namespace: metadata?.namespace,
            resourceVersion: metadata?.resourceVersion,
            uid: metadata?.uid,
          },
    };
    return lch.tagImages;
  };
  return {
    [lchName]: {
      failurePolicy: lch.failurePolicy,
      ...(lcAction === LifecycleAction.execNewPod && {
        execNewPod: {
          ...lch.execNewPod,
          volumes: lch.execNewPod.volumes ? _.split(lch.execNewPod.volumes, ',') : [],
        },
      }),
      ...(lcAction === LifecycleAction.tagImages && {
        tagImages: getUpdatedTagImages(),
      }),
    },
  };
};

export const getUpdatedStrategy = (strategy: DeploymentStrategy, resourceType: string) => {
  const { type, imageStreamData } = strategy;
  switch (type) {
    case DeploymentStrategyType.recreateParams: {
      const { mid: midHook, post: postHook, pre: preHook, timeoutSeconds } =
        strategy.recreateParams ?? {};
      return {
        type,
        ...(resourceType === Resources.OpenShift
          ? {
              recreateParams: {
                ...(timeoutSeconds ? { timeoutSeconds } : {}),
                ...(preHook.exists
                  ? getUpdatedLchData(preHook.lch, 'pre', preHook.action, imageStreamData.pre)
                  : {}),
                ...(midHook.exists
                  ? getUpdatedLchData(midHook.lch, 'mid', midHook.action, imageStreamData.mid)
                  : {}),
                ...(postHook.exists
                  ? getUpdatedLchData(postHook.lch, 'post', postHook.action, imageStreamData.post)
                  : {}),
              },
            }
          : {}),
      };
    }
    case DeploymentStrategyType.customParams: {
      return {
        type,
        customParams: strategy.customParams,
      };
    }
    case DeploymentStrategyType.rollingParams: {
      const {
        post: postHook,
        pre: preHook,
        maxSurge,
        maxUnavailable,
        timeoutSeconds,
        updatePeriodSeconds,
        intervalSeconds,
      } = strategy.rollingParams;
      return {
        type,
        rollingParams: {
          ...(timeoutSeconds ? { timeoutSeconds } : {}),
          ...(updatePeriodSeconds ? { updatePeriodSeconds } : {}),
          ...(intervalSeconds ? { intervalSeconds } : {}),
          ...(preHook.exists
            ? getUpdatedLchData(preHook.lch, 'pre', preHook.action, imageStreamData.pre)
            : {}),
          ...(postHook.exists
            ? getUpdatedLchData(postHook.lch, 'post', postHook.action, imageStreamData.pre)
            : {}),
          ...(maxSurge
            ? { maxSurge: !_.endsWith(maxSurge, '%') ? parseInt(maxSurge, 10) : maxSurge }
            : {}),
          ...(maxUnavailable
            ? {
                maxUnavailable: !_.endsWith(maxUnavailable, '%')
                  ? parseInt(maxUnavailable, 10)
                  : maxUnavailable,
              }
            : {}),
        },
      };
    }
    case DeploymentStrategyType.rollingUpdate: {
      const { maxSurge, maxUnavailable } = strategy.rollingUpdate;
      return {
        type,
        rollingUpdate: {
          ...(maxSurge
            ? { maxSurge: !_.endsWith(maxSurge, '%') ? parseInt(maxSurge, 10) : maxSurge }
            : {}),
          ...(maxUnavailable
            ? {
                maxUnavailable: !_.endsWith(maxUnavailable, '%')
                  ? parseInt(maxUnavailable, 10)
                  : maxUnavailable,
              }
            : {}),
        },
      };
    }
    default:
      return {};
  }
};

export const convertEditFormToDeployment = (
  formValues: EditDeploymentFormData,
  deployment: K8sResourceKind,
) => {
  const {
    deploymentStrategy,
    containers,
    imageName,
    envs,
    imagePullSecret,
    paused,
    replicas,
    imageStream: { image, tag, namespace: imgNs },
    isi,
    triggers,
    fromImageStreamTag,
  } = formValues;
  const resourceType = getResourcesType(deployment);

  let newDeployment: K8sResourceKind = {
    ...deployment,
    spec: {
      ...deployment.spec,
      paused,
      replicas,
      strategy: getUpdatedStrategy(deploymentStrategy, resourceType),
      template: {
        ...deployment.spec.template,
        spec: {
          ...deployment.spec.template.spec,
          containers: getUpdatedContainers(containers, fromImageStreamTag, isi, imageName, envs),
          imagePullSecrets: [
            ...(deployment.spec.template.spec.imagePullSecrets ?? []),
            ...(imagePullSecret ? [{ name: imagePullSecret }] : []),
          ],
        },
      },
    },
  };

  if (resourceType === Resources.OpenShift) {
    newDeployment = {
      ...newDeployment,
      spec: {
        ...newDeployment.spec,
        triggers: [
          ...(fromImageStreamTag && !_.isEmpty(isi.image)
            ? [
                {
                  type: 'ImageChange',
                  imageChangeParams: {
                    automatic: triggers.image,
                    containerNames: [containers[0].name],
                    from: {
                      kind: 'ImageStreamTag',
                      name: `${image}:${tag}`,
                      namespace: imgNs,
                    },
                  },
                },
              ]
            : []),
          ...(triggers.config ? [{ type: 'ConfigChange' }] : []),
        ],
      },
    };
  } else {
    newDeployment = {
      ...newDeployment,
      metadata: {
        ...newDeployment.metadata,
        annotations: {
          ...newDeployment.metadata.annotations,
          ...(fromImageStreamTag && !_.isEmpty(isi.image)
            ? getTriggerAnnotation(containers[0].name, image, imgNs, triggers.image, tag)
            : {}),
        },
      },
    };
  }

  return newDeployment;
};
