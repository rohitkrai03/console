export const GitSectionLoader = () => import('./GitSection' /* webpackChunkName: "git-section" */);

export const getGitSectionInitialValues = () =>
  import('./initial-values' /* webpackChunkName: "git-section-initial-values" */).then(
    (m) => m.gitSectionInitialValues,
  );

export const getGitSectionValidationSchema = () =>
  import('../import/validation-schema' /* webpackChunkName: "git-section-initial-values" */).then(
    (m) => m.gitValidationSchema,
  );
