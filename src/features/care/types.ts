/** OpenAPI: ScreenProductSummary */
export type CareProductSummary = {
  productId: number;
  productImageUrl?: string | null;
  productName?: string | null;
  materialId?: string | null;
  materialDisplayName?: string | null;
  color?: string | null;
  modelCode?: string | null;
  dppCode?: string | null;
};

/** OpenAPI: Environment30d */
export type Environment30d = {
  avgTemperature?: number | null;
  temperatureDescription?: string | null;
  avgHumidity?: number | null;
  humidityDescription?: string | null;
  shockLevelLabel?: string | null;
  outingCount?: number | null;
};

/** OpenAPI: CareDiagnosisHomeResponse */
export type CareDiagnosisHome = {
  product?: CareProductSummary | null;
  totalOutingCount?: number | null;
  condition?: { summary?: string | null; description?: string | null } | null;
  environment30d?: Environment30d | null;
};

/** OpenAPI: CareReportScreenResponse */
export type CareReportScreen = {
  careReportId?: number | null;
  generatedAt?: string | null;
  condition?: { summary?: string | null; detail?: string | null } | null;
  environment30d?: Environment30d | null;
  interpretation?: string | null;
  careNeeded?: boolean | null;
  careCycleMonths?: number | null;
  nextCareRecommendedAt?: string | null;
};

/** OpenAPI: MetricPoint */
export type MetricPoint = {
  label?: string | null;
  value?: number | null;
};

/** OpenAPI: PeriodEnvironment */
export type PeriodEnvironment = {
  period?: string | null;
  temperaturePoints?: MetricPoint[] | null;
  humidityPoints?: MetricPoint[] | null;
  avgTemperature?: number | null;
  avgHumidity?: number | null;
  outingCount?: number | null;
  shockCount?: number | null;
  interpretation?: string | null;
};

/** OpenAPI: CareEnvironmentOverviewResponse */
export type CareEnvironmentOverview = {
  sevenDays?: PeriodEnvironment | null;
  thirtyDays?: PeriodEnvironment | null;
  oneYear?: PeriodEnvironment | null;
};

/** OpenAPI: CareGuideResponse */
export type CareGuide = {
  productId: number;
  materialId?: string | null;
  materialDisplayName?: string | null;
  guideImageUrl?: string | null;
  title?: string | null;
  description?: string | null;
  steps?: string[] | null;
  tip?: string | null;
};
