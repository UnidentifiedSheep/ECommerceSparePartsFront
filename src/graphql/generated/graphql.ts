/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type AddPermissionToRoleInput = {
  permissionName: string;
  roleName: string;
};

export type AddStorageContentInput = {
  items: Array<NewStorageContentInput>;
  storageCode: string;
};

export type AddUserEmailInput = {
  email: string;
  type: EmailType;
  userId: string;
};

export type AnalyticsRunCursorValueInput = {
  createdAt: string;
  id: string;
};

export type CandidateMappingStatus =
  | 'ALL'
  | 'MAPPED'
  | 'UNMAPPED';

export type CandidateToCatalogueInput = {
  id: string;
  selectedName?: string | null | undefined;
};

export type CatalogueSearchInput = {
  candidateMappingStatus?: CandidateMappingStatus | null | undefined;
  catalogueCandidateSortBy?: Array<SearchCatalogueCandidateSortBy> | null | undefined;
  includeHighlights?: boolean | null | undefined;
  nameModes?: Array<SearchMatchType> | null | undefined;
  pagination: PaginationInput;
  producerIds?: Array<number> | null | undefined;
  productCriteria?: ProductSearchCriteriaInput | null | undefined;
  productGroupIds?: Array<number> | null | undefined;
  productSortBy?: Array<SearchProductSortBy> | null | undefined;
  query?: string | null | undefined;
  skuModes?: Array<SearchMatchType> | null | undefined;
  targets: Array<SearchTarget>;
};

export type CharacteristicSortBy = {
  argument?: string | null | undefined;
  field: CharacteristicSortField;
  isDescending: boolean;
};

export type CharacteristicSortField =
  | 'ID'
  | 'NAME'
  | 'NORMALIZED_NAME';

export type CreateCurrencyInput = {
  code: string;
  currencySign: string;
  name: string;
  shortName: string;
};

export type CreateDeliveryScheduleInput = {
  arrivalTime: string;
  days: Array<DayOfWeek>;
  storageCode: string;
  supplier: Supplier;
};

export type CreateGenerationRequestInput = {
  documentRequest: string;
  documentSystemName: string;
};

export type CreateJobInput = {
  inputState: string;
  maxAttempts: number;
  systemName: string;
};

export type CreateJobScheduleInput = {
  cron: string;
  description?: string | null | undefined;
  enabled: boolean;
  inputState: string;
  jobSystemName: string;
  maxAttempts: number;
  name: string;
};

export type CreateOrganizationInput = {
  name: string;
  ownerId: string;
  systemName: string;
};

export type CreateProducerInput = {
  description?: string | null | undefined;
  name: string;
};

export type CreateProducerSupplierMappingInput = {
  producerId: number;
  supplier: Supplier;
  supplierProducerName: string;
};

export type CreateProductInput = {
  description?: string | null | undefined;
  groupId?: number | null | undefined;
  indicator?: string | null | undefined;
  name: string;
  producerId: number;
  sku: string;
};

export type CreatePurchaseInput = {
  comment?: string | null | undefined;
  contents: Array<NewPurchaseContentInput>;
  currencyId: number;
  forcePayment?: boolean | null | undefined;
  payedSum?: number | null | undefined;
  purchaseDate: string;
  storageCode: string;
  supplierOrganizationId: string;
  supplierUserId: string;
};

export type CreateSaleInput = {
  comment?: string | null | undefined;
  contents: Array<NewSaleContentInput>;
  currencyId: number;
  forcePayment?: boolean | null | undefined;
  organizationId: string;
  payedSum?: number | null | undefined;
  saleDateTime: string;
  storageCode: string;
  userId: string;
};

export type CreateStorageInput = {
  code: string;
  description?: string | null | undefined;
  location?: string | null | undefined;
  type: StorageType;
};

export type CreateTransactionInput = {
  amount: number;
  currencyId: number;
  direction: SystemTransactionDirection;
  forcePayment?: boolean | null | undefined;
  organizationId: string;
  transactionDateTime: string;
};

export type CreateUploadRequestInput = {
  contentType: string;
  fileName: string;
};

export type CreateUserEmailInput = {
  email: string;
  isConfirmed: boolean;
  isPrimary: boolean;
  type: EmailType;
};

export type CreateUserInput = {
  emails: Array<CreateUserEmailInput>;
  password: string;
  phones: Array<CreateUserPhoneInput>;
  roles: Array<string>;
  userInfo: UserInfoInput;
  userName: string;
};

export type CreateUserPhoneInput = {
  isConfirmed: boolean;
  isPrimary: boolean;
  number: string;
  type: PhoneType;
};

export type DayOfWeek =
  | 'FRIDAY'
  | 'MONDAY'
  | 'SATURDAY'
  | 'SUNDAY'
  | 'THURSDAY'
  | 'TUESDAY'
  | 'WEDNESDAY';

export type DeleteProductInput = {
  productId: number;
  rowVersion: number;
};

export type DeletePurchaseInput = {
  purchaseId: string;
};

export type DeleteSaleInput = {
  rowVersion: number;
  saleId: string;
};

export type DeliveryScheduleExceptionInput = {
  date: string;
  storageCode: string;
  supplier: Supplier;
};

export type DimensionUnit =
  | 'CENTIMETER'
  | 'METER'
  | 'MILLIMETER';

export type DocumentGenerationRequestSortBy = {
  argument?: string | null | undefined;
  field: DocumentGenerationRequestSortField;
  isDescending: boolean;
};

export type DocumentGenerationRequestSortField =
  | 'CREATED_AT'
  | 'DOCUMENT_SYSTEM_NAME'
  | 'EXPIRES_AT'
  | 'GENERATED_AT'
  | 'JOB_ID'
  | 'REQUESTER_ID'
  | 'REQUEST_ID';

export type DocumentType =
  | 'DOCX'
  | 'EXCEL'
  | 'HTML'
  | 'PDF';

export type EditPurchaseContentInput = {
  comment?: string | null | undefined;
  count: number;
  id?: number | null | undefined;
  price: number;
  productId: number;
};

export type EditSaleContentInput = {
  comment?: string | null | undefined;
  count: number;
  id?: number | null | undefined;
  price: number;
  priceWithDiscount: number;
  productId: number;
};

export type EditStorageContentInput = {
  buyPrice?: GqlPatchFieldOfDecimalInput | null | undefined;
  count?: GqlPatchFieldOfInt32Input | null | undefined;
  currencyId?: GqlPatchFieldOfInt32Input | null | undefined;
  id: number;
  purchaseDatetime?: GqlPatchFieldOfDateTimeInput | null | undefined;
  rowVersion: number;
};

export type EditUserInfoInput = {
  userId: string;
  userInfo: UserInfoInput;
};

export type EmailType =
  | 'PERSONAL'
  | 'UNKNOWN'
  | 'WORK';

export type GetAnalyticsRunsInput = {
  analysisType?: string | null | undefined;
  cursor: GqlCursorOfNullableOfAnalyticsRunCursorValueInput;
  isPinned?: boolean | null | undefined;
  periodFrom?: string | null | undefined;
  periodTo?: string | null | undefined;
};

export type GetOrganizationsInput = {
  ids?: Array<string> | null | undefined;
  pagination: PaginationInput;
  searchTerm?: string | null | undefined;
  showHidden?: boolean | null | undefined;
  sortBy?: Array<OrganizationSortBy> | null | undefined;
  types?: Array<OrganizationType> | null | undefined;
  userId?: string | null | undefined;
};

export type GetProducersInput = {
  ids?: Array<number> | null | undefined;
  pagination: PaginationInput;
  searchTerm?: string | null | undefined;
};

export type GetPurchasesInput = {
  currencyIds?: Array<number> | null | undefined;
  pagination: PaginationInput;
  productIds?: Array<number> | null | undefined;
  rangeEndDate?: string | null | undefined;
  rangeStartDate?: string | null | undefined;
  searchTerm?: string | null | undefined;
  sortBy?: Array<PurchaseSortBy> | null | undefined;
  supplierOrganizationIds?: Array<string> | null | undefined;
};

export type GetRolesInput = {
  pagination: PaginationInput;
  searchTerm?: string | null | undefined;
};

export type GetSalesInput = {
  currencyIds?: Array<number> | null | undefined;
  organizationIds?: Array<string> | null | undefined;
  pagination: PaginationInput;
  productIds?: Array<number> | null | undefined;
  rangeEndDate?: string | null | undefined;
  rangeStartDate?: string | null | undefined;
  searchTerm?: string | null | undefined;
  sortBy?: Array<SaleSortBy> | null | undefined;
  states?: Array<SaleState> | null | undefined;
};

export type GetStoragesInput = {
  pagination: PaginationInput;
  searchTerm?: string | null | undefined;
  type?: StorageType | null | undefined;
};

export type GetTransactionsInput = {
  currencyId?: number | null | undefined;
  cursor: GqlCursorOfNullableOfTransactionCursorValueInput;
  logicalOperation?: LogicalOperation | null | undefined;
  rangeEnd?: string | null | undefined;
  rangeStart?: string | null | undefined;
  receiverId?: string | null | undefined;
  senderId?: string | null | undefined;
  skipReversed?: boolean | null | undefined;
};

export type GetUploadsInput = {
  cursor?: string | null | undefined;
  size: number;
};

export type GetUsersInput = {
  description?: string | null | undefined;
  email?: string | null | undefined;
  id?: string | null | undefined;
  name?: string | null | undefined;
  pagination: PaginationInput;
  phone?: string | null | undefined;
  roles?: Array<string> | null | undefined;
  surname?: string | null | undefined;
  userName?: string | null | undefined;
};

export type GqlCursorOfNullableOfAnalyticsRunCursorValueInput = {
  size: number;
  value?: AnalyticsRunCursorValueInput | null | undefined;
};

export type GqlCursorOfNullableOfDateTimeInput = {
  size: number;
  value?: string | null | undefined;
};

export type GqlCursorOfNullableOfTransactionCursorValueInput = {
  size: number;
  value?: TransactionCursorValueInput | null | undefined;
};

export type GqlPatchFieldOfBooleanInput = {
  isSet: boolean;
  value: boolean;
};

export type GqlPatchFieldOfDateTimeInput = {
  isSet: boolean;
  value: string;
};

export type GqlPatchFieldOfDecimalInput = {
  isSet: boolean;
  value: number;
};

export type GqlPatchFieldOfInt32Input = {
  isSet: boolean;
  value: number;
};

export type GqlPatchFieldOfNullableOfInt32Input = {
  isSet: boolean;
  value?: number | null | undefined;
};

export type GqlPatchFieldOfStorageTypeInput = {
  isSet: boolean;
  value: StorageType;
};

export type GqlPatchFieldOfStringInput = {
  isSet: boolean;
  value?: string | null | undefined;
};

export type InputControlType =
  | 'DATE_PICKER'
  | 'ENTITY_SELECTOR'
  | 'ENUM_SELECTOR'
  | 'MONTH_PICKER'
  | 'NAMED_OBJECT_SELECTOR'
  | 'TEXT_FIELD'
  | 'UPLOAD_FILE';

export type JobScheduleSortBy = {
  argument?: string | null | undefined;
  field: JobScheduleSortField;
  isDescending: boolean;
};

export type JobScheduleSortField =
  | 'ENABLED'
  | 'ID'
  | 'JOB_SYSTEM_NAME'
  | 'LAST_QUEUED_AT'
  | 'NAME'
  | 'NEXT_RUN_AT';

export type JobSortBy = {
  argument?: string | null | undefined;
  field: JobSortField;
  isDescending: boolean;
};

export type JobSortField =
  | 'CREATED_AT'
  | 'ID'
  | 'STATUS'
  | 'UPDATED_AT';

export type JobStatus =
  | 'BLOCKED'
  | 'CANCELLATION_REQUESTED'
  | 'CANCELLED'
  | 'FAILED'
  | 'LOCKED'
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'WAITING';

export type ListNotificationsInput = {
  cursor: GqlCursorOfNullableOfDateTimeInput;
};

export type LogicalOperation =
  | 'AND'
  | 'OR';

export type MaxCandidateCrossesInput = {
  candidateId: string;
  crossCandidateIds: Array<string>;
  linkageType: ProductLinkageType;
};

export type NewPurchaseContentInput = {
  comment?: string | null | undefined;
  count: number;
  price: number;
  productId: number;
};

export type NewSaleContentInput = {
  comment?: string | null | undefined;
  count: number;
  price: number;
  priceWithDiscount: number;
  productId: number;
};

export type NewStorageContentInput = {
  buyPrice: number;
  count: number;
  currencyId: number;
  productId: number;
  purchaseDate: string;
};

export type OrganizationMemberInput = {
  organizationId: string;
  userId: string;
};

export type OrganizationMemberRoleInput = {
  organizationId: string;
  role: OrganizationRole;
  userId: string;
};

export type OrganizationMembersInput = {
  pagination: PaginationInput;
};

export type OrganizationRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'MEMBER'
  | 'OWNER';

export type OrganizationSortBy = {
  argument?: string | null | undefined;
  field: OrganizationSortField;
  isDescending: boolean;
};

export type OrganizationSortField =
  | 'APPROXIMATE_BALANCE'
  | 'ID'
  | 'NAME'
  | 'SYSTEM_NAME'
  | 'TYPE';

export type OrganizationType =
  | 'BUSINESS'
  | 'INDIVIDUAL'
  | 'SYSTEM';

export type PaginationInput = {
  page: number;
  size: number;
};

export type PatchProducerInput = {
  description?: GqlPatchFieldOfStringInput | null | undefined;
  name?: GqlPatchFieldOfStringInput | null | undefined;
};

export type PatchProductInput = {
  description?: GqlPatchFieldOfStringInput | null | undefined;
  groupId?: GqlPatchFieldOfNullableOfInt32Input | null | undefined;
  indicator?: GqlPatchFieldOfStringInput | null | undefined;
  name?: GqlPatchFieldOfStringInput | null | undefined;
  packingUnit?: GqlPatchFieldOfNullableOfInt32Input | null | undefined;
  pairId?: GqlPatchFieldOfNullableOfInt32Input | null | undefined;
  producerId?: GqlPatchFieldOfInt32Input | null | undefined;
  sku?: GqlPatchFieldOfStringInput | null | undefined;
};

export type PatchStorageInput = {
  description?: GqlPatchFieldOfStringInput | null | undefined;
  location?: GqlPatchFieldOfStringInput | null | undefined;
  type?: GqlPatchFieldOfStorageTypeInput | null | undefined;
};

export type PhoneType =
  | 'HOME'
  | 'MOBILE'
  | 'UNKNOWN'
  | 'WORK';

export type PriceOfferSource =
  | 'ARMTEK'
  | 'FAVORITE_PARTS'
  | 'OUR_WAREHOUSE'
  | 'TMTR';

export type PriceOfferSourceType =
  | 'OUR_WAREHOUSE'
  | 'SUPPLIER';

export type ProducerAliasInput = {
  alias: string;
  producerId: number;
};

export type ProducerSearchInput = {
  pagination: PaginationInput;
  query?: string | null | undefined;
};

export type ProductAvailableStocksInput = {
  storageCode: string;
};

export type ProductCharacteristicCriteriaInput = {
  characteristicId: number;
  exists?: boolean | null | undefined;
  numericRange?: SearchNumericRangeInput | null | undefined;
  values?: Array<string> | null | undefined;
};

export type ProductContentItemInput = {
  childProductId: number;
  quantity: number;
};

export type ProductCrossesInput = {
  pagination: PaginationInput;
  searchTerm?: string | null | undefined;
  sortBy?: Array<ProductSortBy> | null | undefined;
};

export type ProductDimensionsCriteriaInput = {
  height?: SearchNumericRangeInput | null | undefined;
  length?: SearchNumericRangeInput | null | undefined;
  unit: DimensionUnit;
  volume?: SearchNumericRangeInput | null | undefined;
  width?: SearchNumericRangeInput | null | undefined;
};

export type ProductEanInput = {
  ean: string;
  productId: number;
};

export type ProductGroupSortBy = {
  argument?: string | null | undefined;
  field: ProductGroupSortField;
  isDescending: boolean;
};

export type ProductGroupSortField =
  | 'ID'
  | 'NAME'
  | 'NORMALIZED_NAME';

export type ProductLinkageInput = {
  crossProductId: number;
  linkageType: ProductLinkageType;
  productId: number;
};

export type ProductLinkageType =
  | 'FULL_CROSS'
  | 'FULL_LEFT_TO_RIGHT_CROSS'
  | 'FULL_RIGHT_TO_LEFT_CROSS'
  | 'SINGLE_CROSS';

export type ProductOffersInput = {
  currencyId: number;
  pagination: PaginationInput;
  sortBy?: Array<ProductPriceOptionSortBy> | null | undefined;
  sources: Array<PriceOfferSource>;
  storageCode: string;
};

export type ProductPriceOptionSortBy = {
  argument?: string | null | undefined;
  field: ProductPriceOptionSortField;
  isDescending: boolean;
};

export type ProductPriceOptionSortField =
  | 'SCORE';

export type ProductReferenceInput = {
  producerName: string;
  sku: string;
  supplier?: Supplier | null | undefined;
};

export type ProductSaleHistoryInput = {
  currencyId?: number | null | undefined;
  organizationId?: string | null | undefined;
  pagination: PaginationInput;
  showCrosses?: boolean | null | undefined;
  sortBy?: Array<SaleContentSortBy> | null | undefined;
  storageCode?: string | null | undefined;
};

export type ProductSearchCriteriaInput = {
  characteristics?: Array<ProductCharacteristicCriteriaInput> | null | undefined;
  dimensions?: ProductDimensionsCriteriaInput | null | undefined;
  weight?: ProductWeightCriteriaInput | null | undefined;
};

export type ProductSortBy = {
  argument?: string | null | undefined;
  field: ProductSortField;
  isDescending: boolean;
};

export type ProductSortField =
  | 'ID'
  | 'INDICATOR'
  | 'NAME'
  | 'POPULARITY'
  | 'PRODUCER_NAME'
  | 'SKU'
  /** Accepts optional argument of type String. */
  | 'STOCK';

export type ProductStorageContentsInput = {
  pagination: PaginationInput;
  showZeroCount: boolean;
  storageCode?: string | null | undefined;
};

export type ProductWeightCriteriaInput = {
  range: SearchNumericRangeInput;
  unit: WeightUnit;
};

export type PurchaseSortBy = {
  argument?: string | null | undefined;
  field: PurchaseSortField;
  isDescending: boolean;
};

export type PurchaseSortField =
  | 'DATE_TIME'
  | 'ID'
  | 'TOTAL_SUM';

export type RecommendedPriceInput = {
  currencyId: number;
  quantity: number;
  sources: Array<PriceOfferSource>;
  storageCode: string;
};

export type ReverseTransactionInput = {
  forcePayment?: boolean | null | undefined;
  transactionId: string;
};

export type SaleContentSortBy = {
  argument?: string | null | undefined;
  field: SaleContentSortField;
  isDescending: boolean;
};

export type SaleContentSortField =
  | 'DISCOUNTED_PRICE'
  /** Requires argument of type Guid. */
  | 'ORGANIZATION_MATCH'
  | 'ORIGINAL_PRICE'
  | 'QUANTITY'
  | 'SALE_CONTENT_ID'
  | 'SALE_DATE'
  | 'STORAGE_CODE';

export type SaleSortBy = {
  argument?: string | null | undefined;
  field: SaleSortField;
  isDescending: boolean;
};

export type SaleSortField =
  | 'DATE_TIME'
  | 'ID'
  | 'TOTAL_SUM';

export type SaleState =
  | 'COMPLETED'
  | 'DELETED'
  | 'DRAFT';

export type SchemaValueType =
  | 'ARRAY'
  | 'BOOLEAN'
  | 'ENUM'
  | 'INTEGER'
  | 'NUMBER'
  | 'OBJECT'
  | 'STRING';

export type SearchCatalogueCandidateSortBy = {
  argument?: string | null | undefined;
  field: SearchCatalogueCandidateSortField;
  isDescending: boolean;
};

export type SearchCatalogueCandidateSortField =
  | 'ID'
  | 'PRODUCER_ID'
  | 'SKU';

export type SearchCharacteristicsInput = {
  pagination: PaginationInput;
  searchTerm?: string | null | undefined;
  sortBy?: Array<CharacteristicSortBy> | null | undefined;
};

export type SearchDeliverySchedulesInput = {
  pagination: PaginationInput;
  storageCode?: string | null | undefined;
  suppliers: Array<Supplier>;
};

export type SearchDocumentsInput = {
  documentSystemName?: string | null | undefined;
  pagination: PaginationInput;
  requesterId?: string | null | undefined;
  sortBy?: Array<DocumentGenerationRequestSortBy> | null | undefined;
};

export type SearchJobSchedulesInput = {
  jobSystemNames: Array<string>;
  nextRunFrom?: string | null | undefined;
  nextRunTo?: string | null | undefined;
  pagination: PaginationInput;
  sortBy?: Array<JobScheduleSortBy> | null | undefined;
};

export type SearchJobsInput = {
  pagination: PaginationInput;
  sortBy?: Array<JobSortBy> | null | undefined;
  statuses: Array<JobStatus>;
  systemNames: Array<string>;
};

export type SearchMarkupGroupsInput = {
  pagination: PaginationInput;
  searchTerm?: string | null | undefined;
};

export type SearchMatchType =
  | 'CONTAINS'
  | 'EXACT'
  | 'FUZZY'
  | 'STARTS_WITH';

export type SearchNumericRangeInput = {
  gt?: number | null | undefined;
  gte?: number | null | undefined;
  lt?: number | null | undefined;
  lte?: number | null | undefined;
};

export type SearchProductGroupsInput = {
  pagination: PaginationInput;
  searchTerm?: string | null | undefined;
  sortBy?: Array<ProductGroupSortBy> | null | undefined;
};

export type SearchProductSortBy = {
  argument?: string | null | undefined;
  field: SearchProductSortField;
  isDescending: boolean;
};

export type SearchProductSortField =
  | 'HEIGHT'
  | 'ID'
  | 'LENGTH'
  | 'PRODUCER_ID'
  | 'SKU'
  /** Accepts optional argument of type String. */
  | 'STOCK'
  | 'VOLUME'
  | 'WEIGHT'
  | 'WIDTH';

export type SearchTarget =
  | 'CATALOGUE_CANDIDATES'
  | 'PRODUCTS';

export type SearchUsersInput = {
  pagination: PaginationInput;
  roles?: Array<string> | null | undefined;
  searchTerm: string;
};

export type SetProductSizeInput = {
  height: number;
  length: number;
  productId: number;
  unit: DimensionUnit;
  width: number;
};

export type SetProductWeightInput = {
  productId: number;
  unit: WeightUnit;
  weight: number;
};

export type StorageContentSortBy = {
  argument?: string | null | undefined;
  field: StorageContentSortField;
  isDescending: boolean;
};

export type StorageContentSortField =
  | 'AVAILABLE_COUNT'
  | 'BUY_PRICE'
  | 'COUNT'
  | 'CURRENCY_ID'
  | 'ID'
  | 'PRODUCT_ID'
  | 'PURCHASE_DATETIME'
  | 'STORAGE_CODE';

export type StorageContentsSearchInput = {
  pagination: PaginationInput;
  productId?: number | null | undefined;
  showZeroCount: boolean;
  sortBy?: Array<StorageContentSortBy> | null | undefined;
  storageCode?: string | null | undefined;
};

export type StorageType =
  | 'SUPPLIER_STORAGE'
  | 'WAREHOUSE';

export type Supplier =
  | 'ARMTEK'
  | 'FAVORIT_PARTS'
  | 'TMTR';

export type SystemTransactionDirection =
  | 'SYSTEM_TO_USER'
  | 'USER_TO_SYSTEM';

export type TransactionCursorValueInput = {
  id: string;
  transactionDate: string;
};

export type TransactionSourceType =
  | 'LOGISTIC'
  | 'MANUAL'
  | 'PURCHASE'
  | 'SALE';

export type TransactionType =
  | 'ADJUSTMENT'
  | 'FEE'
  | 'REFUND'
  | 'TRANSFER';

export type UpdateDeliveryScheduleInput = {
  arrivalTime: string;
  days: Array<DayOfWeek>;
  storageCode: string;
  supplier: Supplier;
};

export type UpdateJobScheduleInput = {
  cron?: GqlPatchFieldOfStringInput | null | undefined;
  description?: GqlPatchFieldOfStringInput | null | undefined;
  enabled?: GqlPatchFieldOfBooleanInput | null | undefined;
  inputState?: GqlPatchFieldOfStringInput | null | undefined;
  maxAttempts?: GqlPatchFieldOfInt32Input | null | undefined;
  name?: GqlPatchFieldOfStringInput | null | undefined;
  scheduleId: string;
};

export type UpdateOrganizationFinancialProfileInput = {
  minimalAllowedBalance?: GqlPatchFieldOfDecimalInput | null | undefined;
  organizationId: string;
};

export type UpdateOrganizationInput = {
  isHidden?: GqlPatchFieldOfBooleanInput | null | undefined;
  name?: GqlPatchFieldOfStringInput | null | undefined;
  organizationId: string;
};

export type UpdatePurchaseInput = {
  comment?: string | null | undefined;
  contents: Array<EditPurchaseContentInput>;
  currencyId: number;
  purchaseDateTime: string;
  purchaseId: string;
};

export type UpdateSaleInput = {
  comment?: string | null | undefined;
  contents: Array<EditSaleContentInput>;
  currencyId: number;
  forcePayment?: boolean | null | undefined;
  rowVersion: number;
  saleDateTime: string;
  saleId: string;
};

export type UpsertCharacteristicInput = {
  id?: number | null | undefined;
  name: string;
};

export type UpsertMarkupGroupInput = {
  currencyId: number;
  id?: number | null | undefined;
  name?: string | null | undefined;
  ranges: Array<UpsertMarkupRangeInput>;
};

export type UpsertMarkupRangeInput = {
  markup: number;
  rangeEnd: number;
  rangeStart: number;
};

export type UpsertNotificationPreferenceInput = {
  channelName: string;
  isEnabled: boolean;
};

export type UpsertNotificationPreferencesInput = {
  preferences: Array<UpsertNotificationPreferenceInput>;
};

export type UpsertPriceApplierInput = {
  dslLogic?: string | null | undefined;
  name?: string | null | undefined;
  states: Array<UpsertPriceApplierStateInput>;
  systemName: string;
};

export type UpsertPriceApplierStateInput = {
  enabled: boolean;
  order?: number | null | undefined;
  usage: PriceOfferSourceType;
};

export type UpsertProductCharacteristicInput = {
  characteristicId: number;
  productId: number;
  value: string;
};

export type UpsertProductGroupInput = {
  id?: number | null | undefined;
  name: string;
};

export type UpsertRoleInput = {
  description?: string | null | undefined;
  name: string;
};

export type UserEmailInput = {
  email: string;
  userId: string;
};

export type UserInfoInput = {
  description?: string | null | undefined;
  name: string;
  surname: string;
};

export type UserPermissionsInput = {
  permissions: Array<string>;
  userId: string;
};

export type UserRolesInput = {
  roles: Array<string>;
  userId: string;
};

export type WeightUnit =
  | 'GRAM'
  | 'KILOGRAM'
  | 'TONNE';

export type ManagedProducerFragment = { id: number, name: string, description: string | null };

export type ManagedProducersQueryVariables = Exact<{
  input: GetProducersInput;
}>;


export type ManagedProducersQuery = { producers: { list: Array<{ id: number, name: string, description: string | null }> } };

export type CreateProducerMutationVariables = Exact<{
  input: CreateProducerInput;
}>;


export type CreateProducerMutation = { producers: { create: { id: number, name: string, description: string | null } } };

export type EditProducerMutationVariables = Exact<{
  producerId: number;
  input: PatchProducerInput;
}>;


export type EditProducerMutation = { producers: { edit: { id: number, name: string, description: string | null } } };

export type DeleteProducerMutationVariables = Exact<{
  id: number;
}>;


export type DeleteProducerMutation = { producers: { delete: boolean } };

export type ProducerAliasesQueryVariables = Exact<{
  id: number;
}>;


export type ProducerAliasesQuery = { producers: { byId: { id: number, aliases: Array<string> } | null } };

export type AddProducerAliasMutationVariables = Exact<{
  input: ProducerAliasInput;
}>;


export type AddProducerAliasMutation = { producers: { addAlias: { id: number } } };

export type DeleteProducerAliasMutationVariables = Exact<{
  input: ProducerAliasInput;
}>;


export type DeleteProducerAliasMutation = { producers: { deleteAlias: { id: number } } };

export type ProducerSupplierMappingsQueryVariables = Exact<{
  id: number;
}>;


export type ProducerSupplierMappingsQuery = { producers: { byId: { id: number, supplierMappings: Array<{ id: number, supplier: Supplier, supplierProducerName: string, producer: { id: number } }> } | null } };

export type CreateProducerSupplierMappingMutationVariables = Exact<{
  input: CreateProducerSupplierMappingInput;
}>;


export type CreateProducerSupplierMappingMutation = { producers: { createSupplierMapping: { id: number, supplier: Supplier, supplierProducerName: string, producer: { id: number } } } };

export type DeleteProducerSupplierMappingMutationVariables = Exact<{
  id: number;
}>;


export type DeleteProducerSupplierMappingMutation = { producers: { deleteSupplierMapping: boolean } };

export type AllCurrenciesQueryVariables = Exact<{ [key: string]: never; }>;


export type AllCurrenciesQuery = { currencies: { list: Array<{ id: number, name: string, shortName: string, code: string, currencySign: string }> } };

export type BaseCurrencyQueryVariables = Exact<{ [key: string]: never; }>;


export type BaseCurrencyQuery = { currencies: { base: { id: number, name: string, shortName: string, code: string, currencySign: string } } };

export type CreateCurrencyMutationVariables = Exact<{
  input: CreateCurrencyInput;
}>;


export type CreateCurrencyMutation = { currencies: { create: { id: number } } };

export type UpdateCurrencyRatesMutationVariables = Exact<{ [key: string]: never; }>;


export type UpdateCurrencyRatesMutation = { currencies: { updateRates: boolean } };

export type ManagedRoleFragment = { systemName: string, localizedName: string | null, description: string | null, createdAt: string, updatedAt: string, whoCreated: string | null, whoUpdated: string | null };

export type ManagedRolesQueryVariables = Exact<{
  input: GetRolesInput;
}>;


export type ManagedRolesQuery = { roles: { list: Array<{ systemName: string, localizedName: string | null, description: string | null, createdAt: string, updatedAt: string, whoCreated: string | null, whoUpdated: string | null }> } };

export type ManagedRoleQueryVariables = Exact<{
  name: string;
}>;


export type ManagedRoleQuery = { roles: { byName: { systemName: string, localizedName: string | null, description: string | null, createdAt: string, updatedAt: string, whoCreated: string | null, whoUpdated: string | null, permissions: Array<{ systemName: string, name: string, description: string }> } | null } };

export type UpsertRoleMutationVariables = Exact<{
  input: UpsertRoleInput;
}>;


export type UpsertRoleMutation = { roles: { upsert: { systemName: string } } };

export type AddPermissionToRoleMutationVariables = Exact<{
  input: AddPermissionToRoleInput;
}>;


export type AddPermissionToRoleMutation = { roles: { addPermission: { systemName: string } } };

export type EmailOptionsQueryVariables = Exact<{ [key: string]: never; }>;


export type EmailOptionsQuery = { options: { emails: { maxEmailCount: number, minEmailCount: number } } };

export type ManagedStorageFragment = { code: string, description: string | null, location: string | null, type: StorageType };

export type ManagedStoragesQueryVariables = Exact<{
  input: GetStoragesInput;
}>;


export type ManagedStoragesQuery = { storages: { list: Array<{ code: string, description: string | null, location: string | null, type: StorageType }> } };

export type ManagedStorageQueryVariables = Exact<{
  code: string;
}>;


export type ManagedStorageQuery = { storages: { byCode: { code: string, description: string | null, location: string | null, type: StorageType } | null } };

export type CreateStorageMutationVariables = Exact<{
  input: CreateStorageInput;
}>;


export type CreateStorageMutation = { storages: { create: { code: string } } };

export type EditStorageMutationVariables = Exact<{
  code: string;
  input: PatchStorageInput;
}>;


export type EditStorageMutation = { storages: { edit: { code: string } } };

export type DeleteStorageMutationVariables = Exact<{
  code: string;
}>;


export type DeleteStorageMutation = { storages: { delete: boolean } };

export type AddStorageContentMutationVariables = Exact<{
  input: AddStorageContentInput;
}>;


export type AddStorageContentMutation = { storageContents: { add: boolean } };

export type EditStorageContentsMutationVariables = Exact<{
  items: Array<EditStorageContentInput> | EditStorageContentInput;
}>;


export type EditStorageContentsMutation = { storageContents: { edit: boolean } };

export type ZeroStorageContentMutationVariables = Exact<{
  contentId: number;
  rowVersion: number;
}>;


export type ZeroStorageContentMutation = { storageContents: { setToZero: boolean } };

export type UploadsQueryVariables = Exact<{
  input: GetUploadsInput;
}>;


export type UploadsQuery = { uploads: { list: { nextCursor: string | null, hasMore: boolean, files: Array<{ key: string, size: number, lastModified: string | null, fullPath: string }> } } };

export type CreateUploadRequestMutationVariables = Exact<{
  input: CreateUploadRequestInput;
}>;


export type CreateUploadRequestMutation = { uploads: { createRequest: string } };

export type CompleteUploadMutationVariables = Exact<{
  fileName: string;
}>;


export type CompleteUploadMutation = { uploads: { complete: boolean } };

export type AddProductContentsMutationVariables = Exact<{
  productId: number;
  items: Array<ProductContentItemInput> | ProductContentItemInput;
}>;


export type AddProductContentsMutation = { products: { addContent: { id: number } } };

export type RemoveProductContentMutationVariables = Exact<{
  productId: number;
  childProductId: number;
}>;


export type RemoveProductContentMutation = { products: { removeContent: { id: number } } };

export type SetProductContentCountMutationVariables = Exact<{
  productId: number;
  childProductId: number;
  quantity: number;
}>;


export type SetProductContentCountMutation = { products: { setContentCount: { id: number } } };

export type UpsertProductCharacteristicsMutationVariables = Exact<{
  items: Array<UpsertProductCharacteristicInput> | UpsertProductCharacteristicInput;
}>;


export type UpsertProductCharacteristicsMutation = { products: { upsertCharacteristics: boolean } };

export type DeleteProductCharacteristicMutationVariables = Exact<{
  productId: number;
  characteristicId: number;
}>;


export type DeleteProductCharacteristicMutation = { products: { deleteCharacteristic: { id: number } } };

export type CreateProductCrossesMutationVariables = Exact<{
  linkages: Array<ProductLinkageInput> | ProductLinkageInput;
}>;


export type CreateProductCrossesMutation = { products: { createCrosses: boolean } };

export type RemoveProductImageMutationVariables = Exact<{
  productId: number;
  imagePath: string;
}>;


export type RemoveProductImageMutation = { products: { removeImage: { id: number } } };

export type ProductMeasurementsQueryVariables = Exact<{
  id: number;
}>;


export type ProductMeasurementsQuery = { products: { byId: { id: number, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null } };

export type SetProductSizeMutationVariables = Exact<{
  input: SetProductSizeInput;
}>;


export type SetProductSizeMutation = { products: { setSize: { id: number } } };

export type DeleteProductSizeMutationVariables = Exact<{
  productId: number;
}>;


export type DeleteProductSizeMutation = { products: { deleteSize: { id: number } } };

export type SetProductWeightMutationVariables = Exact<{
  input: SetProductWeightInput;
}>;


export type SetProductWeightMutation = { products: { setWeight: { id: number } } };

export type DeleteProductWeightMutationVariables = Exact<{
  productId: number;
}>;


export type DeleteProductWeightMutation = { products: { deleteWeight: { id: number } } };

export type ChartSchemaFieldFragment = { name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null };

export type ChartSchemaFragment = { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, nestedSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null }> } | null, dependency: { entityName: string, fieldName: string | null } | null }> };

export type AvailableChartsQueryVariables = Exact<{ [key: string]: never; }>;


export type AvailableChartsQuery = { analytics: { charts: Array<{ systemName: string, name: string, description: string, queryInputSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, nestedSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null }> } | null, dependency: { entityName: string, fieldName: string | null } | null }> }, dataPointSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, nestedSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null }> } | null, dependency: { entityName: string, fieldName: string | null } | null }> } }> } };

export type AvailableAnalysesQueryVariables = Exact<{ [key: string]: never; }>;


export type AvailableAnalysesQuery = { analytics: { analyses: Array<{ systemName: string, name: string, description: string }> } };

export type AnalysisDefinitionQueryVariables = Exact<{
  systemName: string;
}>;


export type AnalysisDefinitionQuery = { analytics: { analysis: { systemName: string, name: string, description: string, lrtSystemName: string, itemsChartSystemName: string, schemaVersion: number, parametersSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, nestedSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null }> } | null, dependency: { entityName: string, fieldName: string | null } | null }> }, summarySchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, nestedSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null }> } | null, dependency: { entityName: string, fieldName: string | null } | null }> }, segmentsSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, nestedSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null }> } | null, dependency: { entityName: string, fieldName: string | null } | null }> }, dataSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, nestedSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null }> } | null, dependency: { entityName: string, fieldName: string | null } | null }> } } | null } };

export type AnalysisItemsDefinitionQueryVariables = Exact<{
  systemName: string;
}>;


export type AnalysisItemsDefinitionQuery = { analytics: { chart: { systemName: string, queryInputSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, nestedSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null }> } | null, dependency: { entityName: string, fieldName: string | null } | null }> }, dataPointSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, nestedSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null }> } | null, dependency: { entityName: string, fieldName: string | null } | null }> } } | null } };

export type SetAnalyticsRunPinnedMutationVariables = Exact<{
  runId: string;
  isPinned: boolean;
}>;


export type SetAnalyticsRunPinnedMutation = { analytics: { setRunPinned: { id: string, isPinned: boolean } } };

export type AnalyticsRunDetailsQueryVariables = Exact<{
  id: string;
}>;


export type AnalyticsRunDetailsQuery = { analytics: { run: { id: string, analysisType: string, schemaVersion: number, createdAt: string, periodStart: string | null, periodEnd: string | null, itemsCount: number, isPinned: boolean, jobId: string | null, parameters: unknown, summary: unknown } | null } };

export type AnalysisRunItemsQueryVariables = Exact<{
  systemName: string;
  queryInput: unknown;
  products: boolean;
  organizations: boolean;
  users: boolean;
}>;


export type AnalysisRunItemsQuery = { analytics: { chart: { data: { nextCursor: string | null, points: Array<{ value: unknown, references: Array<{ field: string, entity: string, target:
              | { __typename: 'Organization' } & { name?: string, organizationId?: string }
              | { __typename: 'Product' } & { sku?: string, name?: string, productId?: number, producer?: { name: string } }
              | { __typename: 'User' } & { userName?: string, userId?: string, info?: { name: string, surname: string } | null }
             }> }> } } | null } };

export type AnalyticsRunsQueryVariables = Exact<{
  input: GetAnalyticsRunsInput;
}>;


export type AnalyticsRunsQuery = { analytics: { runs: Array<{ id: string, analysisType: string, schemaVersion: number, createdAt: string, periodStart: string | null, periodEnd: string | null, itemsCount: number, isPinned: boolean }> } };

export type SalesProfitChartQueryVariables = Exact<{
  systemName: string;
  queryInput: unknown;
}>;


export type SalesProfitChartQuery = { analytics: { chart: { systemName: string, data: { nextCursor: string | null, points: Array<{ value: unknown }> } } | null } };

export type CurrencyHistoryQueryVariables = Exact<{
  id: number;
  pagination: PaginationInput;
}>;


export type CurrencyHistoryQuery = { currencies: { byId: { id: number, history: Array<{ id: number, rate: number, createdAt: string, fromCurrency: { id: number, name: string, shortName: string, code: string, currencySign: string }, toCurrency: { id: number, name: string, shortName: string, code: string, currencySign: string } }> } | null } };

export type DeliveryScheduleFieldsFragment = { supplier: Supplier, storageCode: string, days: Array<DayOfWeek>, arrivalTime: string, exceptions: Array<string> };

export type SearchDeliverySchedulesQueryVariables = Exact<{
  input: SearchDeliverySchedulesInput;
}>;


export type SearchDeliverySchedulesQuery = { deliverySchedules: { search: Array<{ supplier: Supplier, storageCode: string, days: Array<DayOfWeek>, arrivalTime: string, exceptions: Array<string> }> } };

export type CreateDeliveryScheduleMutationVariables = Exact<{
  input: CreateDeliveryScheduleInput;
}>;


export type CreateDeliveryScheduleMutation = { deliverySchedules: { create: { supplier: Supplier, storageCode: string, days: Array<DayOfWeek>, arrivalTime: string, exceptions: Array<string> } } };

export type UpdateDeliveryScheduleMutationVariables = Exact<{
  input: UpdateDeliveryScheduleInput;
}>;


export type UpdateDeliveryScheduleMutation = { deliverySchedules: { update: { supplier: Supplier, storageCode: string, days: Array<DayOfWeek>, arrivalTime: string, exceptions: Array<string> } } };

export type DeleteDeliveryScheduleMutationVariables = Exact<{
  supplier: Supplier;
  storageCode: string;
}>;


export type DeleteDeliveryScheduleMutation = { deliverySchedules: { delete: boolean } };

export type AddDeliveryScheduleExceptionMutationVariables = Exact<{
  input: DeliveryScheduleExceptionInput;
}>;


export type AddDeliveryScheduleExceptionMutation = { deliverySchedules: { addException: { supplier: Supplier, storageCode: string, days: Array<DayOfWeek>, arrivalTime: string, exceptions: Array<string> } } };

export type RemoveDeliveryScheduleExceptionMutationVariables = Exact<{
  input: DeliveryScheduleExceptionInput;
}>;


export type RemoveDeliveryScheduleExceptionMutation = { deliverySchedules: { removeException: { supplier: Supplier, storageCode: string, days: Array<DayOfWeek>, arrivalTime: string, exceptions: Array<string> } } };

export type SaleCreatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type SaleCreatedSubscription = { onSaleCreated: { sale: { id: string, comment: string | null, saleDatetime: string, totalSum: number, rowVersion: number, state: SaleState, buyer: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, organization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } } } };

export type SaleUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type SaleUpdatedSubscription = { onSaleUpdated: { sale: { id: string, comment: string | null, saleDatetime: string, totalSum: number, rowVersion: number, state: SaleState, buyer: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, organization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } } } };

export type SaleDeletedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type SaleDeletedSubscription = { onSaleDeleted: { sale: { id: string, comment: string | null, saleDatetime: string, totalSum: number, rowVersion: number, state: SaleState, buyer: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, organization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } } } };

export type PurchaseCreatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type PurchaseCreatedSubscription = { onPurchaseCreated: { purchase: { id: string, comment: string | null, purchaseDatetime: string, totalSum: number, supplier: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, supplierOrganization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } } } };

export type PurchaseUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type PurchaseUpdatedSubscription = { onPurchaseUpdated: { purchase: { id: string, comment: string | null, purchaseDatetime: string, totalSum: number, supplier: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, supplierOrganization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } } } };

export type PurchaseDeletedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type PurchaseDeletedSubscription = { onPurchaseDeleted: { purchaseId: string } };

export type AvailableDocumentsQueryVariables = Exact<{ [key: string]: never; }>;


export type AvailableDocumentsQuery = { documents: { available: Array<{ systemName: string, name: string, description: string, documentGroup: string, supportedDocumentTypes: Array<DocumentType>, requestSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, control: InputControlType | null, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null, nestedSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, control: InputControlType | null, required: boolean, label: string | null, description: string | null, accepts: Array<string> }> } | null }> } }> } };

export type DocumentGenerationRequestFieldsFragment = { requestId: string, status: JobStatus, documentSystemName: string, requesterId: string | null, createdAt: string, generatedAt: string | null, expiresAt: string | null, job: { id: string } | null, fileLink: { url: string, expiresAtUtc: string } | null };

export type CreateDocumentGenerationRequestMutationVariables = Exact<{
  input: CreateGenerationRequestInput;
}>;


export type CreateDocumentGenerationRequestMutation = { documents: { createGenerationRequest: { requestId: string, status: JobStatus, documentSystemName: string, requesterId: string | null, createdAt: string, generatedAt: string | null, expiresAt: string | null, job: { id: string } | null, fileLink: { url: string, expiresAtUtc: string } | null } } };

export type DocumentByIdQueryVariables = Exact<{
  requestId: string;
}>;


export type DocumentByIdQuery = { documents: { byId: { requestId: string, status: JobStatus, documentSystemName: string, requesterId: string | null, createdAt: string, generatedAt: string | null, expiresAt: string | null, job: { id: string } | null, fileLink: { url: string, expiresAtUtc: string } | null } | null } };

export type DocumentsByIdsQueryVariables = Exact<{
  requestIds: Array<string> | string;
}>;


export type DocumentsByIdsQuery = { documents: { byIds: Array<{ requestId: string, status: JobStatus, documentSystemName: string, requesterId: string | null, createdAt: string, generatedAt: string | null, expiresAt: string | null, job: { id: string } | null, fileLink: { url: string, expiresAtUtc: string } | null }> } };

export type SearchDocumentsQueryVariables = Exact<{
  input: SearchDocumentsInput;
}>;


export type SearchDocumentsQuery = { documents: { search: Array<{ requestId: string, status: JobStatus, documentSystemName: string, requesterId: string | null, createdAt: string, generatedAt: string | null, expiresAt: string | null, job: { id: string } | null, fileLink: { url: string, expiresAtUtc: string } | null }> } };

export type JobFieldsFragment = { id: string, isStep: boolean, stepKey: string | null, inputInitialized: boolean, status: JobStatus, attempts: number, maxAttempts: number, errorMessage: string | null, lockedAt: string | null, createdAt: string, updatedAt: string, multiStepJob: { id: string } | null, info: { systemName: string, name: string, description: string } | null, createdBy: { id: string } | null };

export type JobScheduleFieldsFragment = { id: string, name: string, description: string | null, inputState: string, maxAttempts: number, cron: string, localizedCron: string, lastQueuedAt: string | null, nextRunAt: string | null, enabled: boolean, jobInfo: { systemName: string, name: string } | null };

export type AvailableJobsQueryVariables = Exact<{ [key: string]: never; }>;


export type AvailableJobsQuery = { jobs: { available: Array<{ systemName: string, name: string, description: string, initStateSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, nestedSchema: { version: number, fields: Array<{ name: string, type: SchemaValueType, required: boolean, label: string | null, labelKey: string | null, description: string | null, descriptionKey: string | null, control: InputControlType | null, accepts: Array<string>, dependency: { entityName: string, fieldName: string | null } | null }> } | null, dependency: { entityName: string, fieldName: string | null } | null }> } }> } };

export type SearchJobsQueryVariables = Exact<{
  input: SearchJobsInput;
}>;


export type SearchJobsQuery = { jobs: { search: Array<{ id: string, isStep: boolean, stepKey: string | null, inputInitialized: boolean, status: JobStatus, attempts: number, maxAttempts: number, errorMessage: string | null, lockedAt: string | null, createdAt: string, updatedAt: string, multiStepJob: { id: string } | null, info: { systemName: string, name: string, description: string } | null, createdBy: { id: string } | null }> } };

export type JobByIdQueryVariables = Exact<{
  id: string;
}>;


export type JobByIdQuery = { jobs: { byId: { id: string, isStep: boolean, stepKey: string | null, inputInitialized: boolean, status: JobStatus, attempts: number, maxAttempts: number, errorMessage: string | null, lockedAt: string | null, createdAt: string, updatedAt: string, multiStepJob: { id: string } | null, info: { systemName: string, name: string, description: string } | null, createdBy: { id: string } | null } | null } };

export type JobStateByIdQueryVariables = Exact<{
  id: string;
}>;


export type JobStateByIdQuery = { jobs: { byId: { id: string, state: { state: string, inputInitialized: boolean, output: string | null } } | null } };

export type CreateJobMutationVariables = Exact<{
  input: CreateJobInput;
}>;


export type CreateJobMutation = { jobs: { create: { id: string, isStep: boolean, stepKey: string | null, inputInitialized: boolean, status: JobStatus, attempts: number, maxAttempts: number, errorMessage: string | null, lockedAt: string | null, createdAt: string, updatedAt: string, multiStepJob: { id: string } | null, info: { systemName: string, name: string, description: string } | null, createdBy: { id: string } | null } } };

export type CancelJobMutationVariables = Exact<{
  id: string;
}>;


export type CancelJobMutation = { jobs: { cancel: boolean } };

export type SearchJobSchedulesQueryVariables = Exact<{
  input: SearchJobSchedulesInput;
}>;


export type SearchJobSchedulesQuery = { jobSchedules: { search: Array<{ id: string, name: string, description: string | null, inputState: string, maxAttempts: number, cron: string, localizedCron: string, lastQueuedAt: string | null, nextRunAt: string | null, enabled: boolean, jobInfo: { systemName: string, name: string } | null }> } };

export type CreateJobScheduleMutationVariables = Exact<{
  input: CreateJobScheduleInput;
}>;


export type CreateJobScheduleMutation = { jobSchedules: { create: { id: string, name: string, description: string | null, inputState: string, maxAttempts: number, cron: string, localizedCron: string, lastQueuedAt: string | null, nextRunAt: string | null, enabled: boolean, jobInfo: { systemName: string, name: string } | null } } };

export type UpdateJobScheduleMutationVariables = Exact<{
  input: UpdateJobScheduleInput;
}>;


export type UpdateJobScheduleMutation = { jobSchedules: { update: { id: string, name: string, description: string | null, inputState: string, maxAttempts: number, cron: string, localizedCron: string, lastQueuedAt: string | null, nextRunAt: string | null, enabled: boolean, jobInfo: { systemName: string, name: string } | null } } };

export type RemoveJobScheduleMutationVariables = Exact<{
  id: string;
}>;


export type RemoveJobScheduleMutation = { jobSchedules: { remove: boolean } };

export type JobUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type JobUpdatedSubscription = { onJobUpdated: { job: { id: string, isStep: boolean, stepKey: string | null, inputInitialized: boolean, status: JobStatus, attempts: number, maxAttempts: number, errorMessage: string | null, lockedAt: string | null, createdAt: string, updatedAt: string, multiStepJob: { id: string } | null, info: { systemName: string, name: string, description: string } | null, createdBy: { id: string } | null } } };

export type NotificationFieldsFragment = { id: number, userId: string, text: string, createdAt: string, seenAt: string | null };

export type NotificationsListQueryVariables = Exact<{
  input: ListNotificationsInput;
}>;


export type NotificationsListQuery = { notifications: { list: Array<{ id: number, userId: string, text: string, createdAt: string, seenAt: string | null }> } };

export type MyNotificationPreferencesQueryVariables = Exact<{ [key: string]: never; }>;


export type MyNotificationPreferencesQuery = { notifications: { myPreferences: Array<{ channelName: string, localizableChannelName: string, enabled: boolean, userId: string }> } };

export type SeeNotificationsMutationVariables = Exact<{
  ids: Array<number> | number;
}>;


export type SeeNotificationsMutation = { notifications: { see: boolean } };

export type UpsertNotificationPreferencesMutationVariables = Exact<{
  input: UpsertNotificationPreferencesInput;
}>;


export type UpsertNotificationPreferencesMutation = { notifications: { upsertPreferences: boolean } };

export type NotificationCreatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type NotificationCreatedSubscription = { onNotificationCreated: { notification: { id: number, userId: string, text: string, createdAt: string, seenAt: string | null } } };

export type OperationCurrencyFragment = { id: number, name: string, shortName: string, code: string, currencySign: string };

export type OperationUserFragment = { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null };

export type OperationOrganizationFragment = { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } };

export type SaleFieldsFragment = { id: string, comment: string | null, saleDatetime: string, totalSum: number, rowVersion: number, state: SaleState, buyer: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, organization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } };

export type SaleContentFieldsFragment = { id: number, count: number, originalPrice: number, discountedPrice: number, totalSum: number, comment: string | null, product: { id: number, sku: string, name: string, producer: { name: string } }, details: Array<{ id: number, saleContentId: number, storageContentId: number, buyPrice: number, count: number, purchaseDatetime: string, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } }> };

export type PurchaseFieldsFragment = { id: string, comment: string | null, purchaseDatetime: string, totalSum: number, supplier: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, supplierOrganization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } };

export type PurchaseContentFieldsFragment = { id: number, count: number, price: number, totalSum: number, comment: string | null, product: { id: number, sku: string, name: string, producer: { name: string } } };

export type TransactionFieldsFragment = { id: string, amount: number, transactionDate: string, type: TransactionType, sourceType: TransactionSourceType, isCompleted: boolean, isReversed: boolean, reversedAt: string | null, sender: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, receiver: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } };

export type ListSalesQueryVariables = Exact<{
  input: GetSalesInput;
}>;


export type ListSalesQuery = { sales: { list: Array<{ id: string, comment: string | null, saleDatetime: string, totalSum: number, rowVersion: number, state: SaleState, buyer: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, organization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } }> } };

export type SaleByIdQueryVariables = Exact<{
  id: string;
}>;


export type SaleByIdQuery = { sales: { byId: { id: string, comment: string | null, saleDatetime: string, totalSum: number, rowVersion: number, state: SaleState, buyer: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, organization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } } | null } };

export type SaleByTransactionQueryVariables = Exact<{
  transactionId: string;
}>;


export type SaleByTransactionQuery = { sales: { byTransactionId: { id: string, comment: string | null, saleDatetime: string, totalSum: number, rowVersion: number, state: SaleState, buyer: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, organization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } } } };

export type SaleContentsQueryVariables = Exact<{
  id: string;
}>;


export type SaleContentsQuery = { sales: { byId: { id: string, contents: Array<{ id: number, count: number, originalPrice: number, discountedPrice: number, totalSum: number, comment: string | null, product: { id: number, sku: string, name: string, producer: { name: string } }, details: Array<{ id: number, saleContentId: number, storageContentId: number, buyPrice: number, count: number, purchaseDatetime: string, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } }> }> } | null } };

export type ListPurchasesQueryVariables = Exact<{
  input: GetPurchasesInput;
}>;


export type ListPurchasesQuery = { purchases: { list: Array<{ id: string, comment: string | null, purchaseDatetime: string, totalSum: number, supplier: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, supplierOrganization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } }> } };

export type PurchaseByIdQueryVariables = Exact<{
  id: string;
}>;


export type PurchaseByIdQuery = { purchases: { byId: { id: string, comment: string | null, purchaseDatetime: string, totalSum: number, supplier: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, supplierOrganization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } } | null } };

export type PurchaseByTransactionQueryVariables = Exact<{
  transactionId: string;
}>;


export type PurchaseByTransactionQuery = { purchases: { byTransactionId: { id: string, comment: string | null, purchaseDatetime: string, totalSum: number, supplier: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, supplierOrganization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } } } };

export type PurchaseContentsQueryVariables = Exact<{
  id: string;
}>;


export type PurchaseContentsQuery = { purchases: { byId: { id: string, contents: Array<{ id: number, count: number, price: number, totalSum: number, comment: string | null, product: { id: number, sku: string, name: string, producer: { name: string } } }> } | null } };

export type ListTransactionsQueryVariables = Exact<{
  input: GetTransactionsInput;
}>;


export type ListTransactionsQuery = { transactions: { list: Array<{ id: string, amount: number, transactionDate: string, type: TransactionType, sourceType: TransactionSourceType, isCompleted: boolean, isReversed: boolean, reversedAt: string | null, sender: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, receiver: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } }> } };

export type ProductSalesHistoryQueryVariables = Exact<{
  id: number;
  input: ProductSaleHistoryInput;
}>;


export type ProductSalesHistoryQuery = { products: { byId: { id: number, saleHistory: Array<{ saleContentId: number, quantity: number, originalPrice: number, discountedPrice: number, averageBuyPrice: number, saleDate: string, product: { id: number, sku: string, name: string, producer: { id: number, name: string } }, organization: { id: string, name: string, systemName: string }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string }, createdBy: { id: string } | null }> } | null } };

export type CreateSaleMutationVariables = Exact<{
  input: CreateSaleInput;
}>;


export type CreateSaleMutation = { sales: { create: { id: string, comment: string | null, saleDatetime: string, totalSum: number, rowVersion: number, state: SaleState, buyer: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, organization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } } } };

export type UpdateSaleMutationVariables = Exact<{
  input: UpdateSaleInput;
}>;


export type UpdateSaleMutation = { sales: { update: { id: string } } };

export type DeleteSaleMutationVariables = Exact<{
  input: DeleteSaleInput;
}>;


export type DeleteSaleMutation = { sales: { delete: string } };

export type CreatePurchaseMutationVariables = Exact<{
  input: CreatePurchaseInput;
}>;


export type CreatePurchaseMutation = { purchases: { create: { id: string, comment: string | null, purchaseDatetime: string, totalSum: number, supplier: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }, supplierOrganization: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }, storage: { code: string }, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } } } };

export type UpdatePurchaseMutationVariables = Exact<{
  input: UpdatePurchaseInput;
}>;


export type UpdatePurchaseMutation = { purchases: { update: { id: string } } };

export type DeletePurchaseMutationVariables = Exact<{
  input: DeletePurchaseInput;
}>;


export type DeletePurchaseMutation = { purchases: { delete: string } };

export type CreateTransactionMutationVariables = Exact<{
  input: CreateTransactionInput;
}>;


export type CreateTransactionMutation = { transactions: { create: { id: string } } };

export type ReverseTransactionMutationVariables = Exact<{
  input: ReverseTransactionInput;
}>;


export type ReverseTransactionMutation = { transactions: { reverse: { id: string } } };

export type UserSummaryFieldsFragment = { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null };

export type UserDetailsFieldsFragment = { normalizedUserName: string, createdAt: string, updatedAt: string, twoFactorEnabled: boolean, lockoutEnd: string | null, accessFailedCount: number, lastLoginAt: string | null, id: string, userName: string, info: { name: string, surname: string, description: string | null } | null };

export type UserEmailFieldsFragment = { email: string, confirmed: boolean, emailType: EmailType, isPrimary: boolean, confirmedAt: string | null, createdAt: string, updatedAt: string };

export type OrganizationFieldsFragment = { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } };

export type OrganizationFinancesFieldsFragment = { financialProfile: { minimalAllowedBalance: number, netPositionInBaseCurrency: number } | null, balances: Array<{ balance: number, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } }> };

export type ListUsersQueryVariables = Exact<{
  input: GetUsersInput;
}>;


export type ListUsersQuery = { users: { list: Array<{ normalizedUserName: string, createdAt: string, updatedAt: string, twoFactorEnabled: boolean, lockoutEnd: string | null, accessFailedCount: number, lastLoginAt: string | null, id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }> } };

export type SearchUsersQueryVariables = Exact<{
  input: SearchUsersInput;
}>;


export type SearchUsersQuery = { users: { search: Array<{ normalizedUserName: string, createdAt: string, updatedAt: string, twoFactorEnabled: boolean, lockoutEnd: string | null, accessFailedCount: number, lastLoginAt: string | null, id: string, userName: string, info: { name: string, surname: string, description: string | null } | null }> } };

export type UserDetailsQueryVariables = Exact<{
  id: string;
  includeInfo: boolean;
}>;


export type UserDetailsQuery = { users: { byId: { normalizedUserName: string, createdAt: string, updatedAt: string, twoFactorEnabled: boolean, lockoutEnd: string | null, accessFailedCount: number, lastLoginAt: string | null, id: string, userName: string, emails?: Array<{ email: string, confirmed: boolean, emailType: EmailType, isPrimary: boolean, confirmedAt: string | null, createdAt: string, updatedAt: string }>, phones?: Array<{ number: string, type: PhoneType, isConfirmed: boolean, isPrimary: boolean }>, roles?: Array<{ systemName: string, localizedName: string | null }>, permissions?: Array<{ systemName: string, name: string, description: string }>, info: { name: string, surname: string, description: string | null } | null } | null } };

export type ListOrganizationsQueryVariables = Exact<{
  input: GetOrganizationsInput;
}>;


export type ListOrganizationsQuery = { organizations: { list: Array<{ id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }> } };

export type OrganizationByIdQueryVariables = Exact<{
  id: string;
}>;


export type OrganizationByIdQuery = { organizations: { byId: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } } | null } };

export type OrganizationMembersQueryVariables = Exact<{
  id: string;
  input: OrganizationMembersInput;
}>;


export type OrganizationMembersQuery = { organizations: { byId: { members: Array<{ role: OrganizationRole, user: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } }> } | null } };

export type OrganizationFinancesQueryVariables = Exact<{
  id: string;
}>;


export type OrganizationFinancesQuery = { organizations: { byId: { finances: { financialProfile: { minimalAllowedBalance: number, netPositionInBaseCurrency: number } | null, balances: Array<{ balance: number, currency: { id: number, name: string, shortName: string, code: string, currencySign: string } }> } } | null } };

export type OrganizationSystemNameAvailableQueryVariables = Exact<{
  systemName: string;
}>;


export type OrganizationSystemNameAvailableQuery = { organizations: { isSystemNameAvailable: boolean } };

export type CreateUserMutationVariables = Exact<{
  input: CreateUserInput;
}>;


export type CreateUserMutation = { users: { create: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } } };

export type EditUserInfoMutationVariables = Exact<{
  input: EditUserInfoInput;
}>;


export type EditUserInfoMutation = { users: { editInfo: { id: string, info: { name: string, surname: string, description: string | null } | null } } };

export type AddUserEmailMutationVariables = Exact<{
  input: AddUserEmailInput;
}>;


export type AddUserEmailMutation = { users: { addEmail: { id: string } } };

export type RequestUserEmailVerificationMutationVariables = Exact<{
  input: UserEmailInput;
}>;


export type RequestUserEmailVerificationMutation = { users: { requestEmailVerification: boolean } };

export type RequestMyEmailVerificationMutationVariables = Exact<{
  email: string;
}>;


export type RequestMyEmailVerificationMutation = { users: { requestMyEmailVerification: boolean } };

export type MakeMyEmailPrimaryMutationVariables = Exact<{
  email: string;
}>;


export type MakeMyEmailPrimaryMutation = { users: { makeMyEmailPrimary: { id: string } } };

export type RemoveUserEmailMutationVariables = Exact<{
  input: UserEmailInput;
}>;


export type RemoveUserEmailMutation = { users: { removeEmail: { id: string } } };

export type MakeUserEmailPrimaryMutationVariables = Exact<{
  input: UserEmailInput;
}>;


export type MakeUserEmailPrimaryMutation = { users: { makeEmailPrimary: { id: string } } };

export type AddUserRolesMutationVariables = Exact<{
  input: UserRolesInput;
}>;


export type AddUserRolesMutation = { users: { addRoles: { id: string } } };

export type RemoveUserRolesMutationVariables = Exact<{
  input: UserRolesInput;
}>;


export type RemoveUserRolesMutation = { users: { removeRoles: { id: string } } };

export type AddUserPermissionsMutationVariables = Exact<{
  input: UserPermissionsInput;
}>;


export type AddUserPermissionsMutation = { users: { addPermissions: { id: string } } };

export type RemoveUserPermissionsMutationVariables = Exact<{
  input: UserPermissionsInput;
}>;


export type RemoveUserPermissionsMutation = { users: { removePermissions: { id: string } } };

export type CreateOrganizationMutationVariables = Exact<{
  input: CreateOrganizationInput;
}>;


export type CreateOrganizationMutation = { organizations: { create: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } } } };

export type UpdateOrganizationMutationVariables = Exact<{
  input: UpdateOrganizationInput;
}>;


export type UpdateOrganizationMutation = { organizations: { update: { id: string, type: OrganizationType, name: string, systemName: string, isHidden: boolean, approximateBalanceInBaseCurrency: number | null, owner: { id: string, userName: string, info: { name: string, surname: string, description: string | null } | null } } } };

export type AddOrganizationMemberMutationVariables = Exact<{
  input: OrganizationMemberRoleInput;
}>;


export type AddOrganizationMemberMutation = { organizations: { addMember: { id: string } } };

export type ChangeOrganizationMemberRoleMutationVariables = Exact<{
  input: OrganizationMemberRoleInput;
}>;


export type ChangeOrganizationMemberRoleMutation = { organizations: { changeMemberRole: { id: string } } };

export type RemoveOrganizationMemberMutationVariables = Exact<{
  input: OrganizationMemberInput;
}>;


export type RemoveOrganizationMemberMutation = { organizations: { removeMember: { id: string } } };

export type UpdateOrganizationFinancialProfileMutationVariables = Exact<{
  input: UpdateOrganizationFinancialProfileInput;
}>;


export type UpdateOrganizationFinancialProfileMutation = { organizations: { updateFinancialProfile: { id: string } } };

export type UserPreviewQueryVariables = Exact<{
  id: string;
  includeRoles: boolean;
}>;


export type UserPreviewQuery = { users: { byId: { id: string, userName: string, roles?: Array<{ systemName: string, localizedName: string | null }>, info: { name: string, surname: string, description: string | null } | null } | null } };

export type MarkupGroupFieldsFragment = { id: number, name: string | null, sourceMessageId: string | null, currency: { id: number } };

export type ProductRecommendedPriceQueryVariables = Exact<{
  id: number;
  input: RecommendedPriceInput;
}>;


export type ProductRecommendedPriceQuery = { products: { byId: { id: number, recommendedPrice: { quantity: number, missingQuantity: number, unitPrice: number | null, totalPrice: number | null, currency: { id: number } } } | null } };

export type MarkupRangeFieldsFragment = { id: number, rangeStart: number, rangeEnd: number, markup: number };

export type PriceApplierFieldsFragment = { systemName: string, name: string, isDynamic: boolean, dslLogic: string | null, states: Array<{ priceApplierSystemName: string, usage: PriceOfferSourceType, order: number, enabled: boolean }> };

export type MarkupGroupsQueryVariables = Exact<{
  input: SearchMarkupGroupsInput;
}>;


export type MarkupGroupsQuery = { markupGroups: { search: Array<{ id: number, name: string | null, sourceMessageId: string | null, currency: { id: number } }> } };

export type MarkupGroupRangesQueryVariables = Exact<{
  id: number;
  pagination: PaginationInput;
}>;


export type MarkupGroupRangesQuery = { markupGroups: { byId: { id: number, ranges: Array<{ id: number, rangeStart: number, rangeEnd: number, markup: number }> } | null } };

export type MarkupGroupUpsertMutationVariables = Exact<{
  input: UpsertMarkupGroupInput;
}>;


export type MarkupGroupUpsertMutation = { markupGroups: { upsert: { id: number, name: string | null, sourceMessageId: string | null, currency: { id: number } } } };

export type MarkupGroupDeleteMutationVariables = Exact<{
  id: number;
}>;


export type MarkupGroupDeleteMutation = { markupGroups: { delete: boolean } };

export type PriceAppliersQueryVariables = Exact<{
  usage: PriceOfferSourceType;
}>;


export type PriceAppliersQuery = { priceAppliers: { list: Array<{ systemName: string, name: string, isDynamic: boolean, dslLogic: string | null, states: Array<{ priceApplierSystemName: string, usage: PriceOfferSourceType, order: number, enabled: boolean }> }> } };

export type PriceApplierUpsertMutationVariables = Exact<{
  input: UpsertPriceApplierInput;
}>;


export type PriceApplierUpsertMutation = { priceAppliers: { upsert: { systemName: string, name: string, isDynamic: boolean, dslLogic: string | null, states: Array<{ priceApplierSystemName: string, usage: PriceOfferSourceType, order: number, enabled: boolean }> } } };

export type PriceApplierDeleteMutationVariables = Exact<{
  systemName: string;
}>;


export type PriceApplierDeleteMutation = { priceAppliers: { delete: boolean } };

export type ProductPriceOffersQueryVariables = Exact<{
  id: number;
  input: ProductOffersInput;
}>;


export type ProductPriceOffersQuery = { products: { byId: { id: number, offers: Array<{ score: number, sellPrice: number, markup: number, deliveryDays: number, guaranteedDeliveryDays: number, deliveryProbability: number, currency: { id: number }, forStorage: { code: string }, offer: { id: string, purchasePrice: number, source: PriceOfferSource, availableQuantity: number, minimumPurchaseQuantity: number, quantityCoefficient: number, daysToRefund: number, deliveryDate: string | null, guaranteedDeliveryDate: string | null, deliveryProbability: number, orderTill: string | null, expiresAt: string, product: { id: number }, currency: { id: number }, offerForStorage: { code: string } } }> } | null } };

export type SchemaProductsByIdsQueryVariables = Exact<{
  ids: Array<number> | number;
}>;


export type SchemaProductsByIdsQuery = { products: { byIds: Array<{ id: number, sku: string, name: string }> } };

export type ProductFieldsFragment = { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null };

export type ProductListFieldsFragment = { id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } };

export type ProductDetailsFieldsFragment = { rowVersion: number, eans?: Array<string>, id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, characteristics: Array<{ value: string, characteristic: { id: number, name: string, normalizedName: string } }>, pair: { id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } } | null, contents: Array<{ quantity: number, product: { images: Array<string>, id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } } }>, crosses?: Array<{ id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } }>, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null };

export type SupplierProductFieldsFragment = { id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> };

export type CatalogueCandidateCrossFieldsFragment = { id: string, sku: string, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> };

export type CatalogueCandidateReviewFieldsFragment = { id: string, sku: string, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> };

export type CatalogueCandidateDetailsFieldsFragment = { id: string, sku: string, crosses: { mapped: Array<{ id: string, sku: string, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> }>, notMapped: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> }, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> };

export type CatalogueCandidateSearchFieldsFragment = { id: string, sku: string, producer: { id: number, name: string }, supplierProducts: Array<{ names: Array<{ name: string }> }> };

export type ProductByIdQueryVariables = Exact<{
  id: number;
  crossesInput: ProductCrossesInput;
  includeCrosses: boolean;
  includeCatalogueCandidate: boolean;
  includeEans: boolean;
}>;


export type ProductByIdQuery = { products: { byId: { rowVersion: number, eans?: Array<string>, id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, characteristics: Array<{ value: string, characteristic: { id: number, name: string, normalizedName: string } }>, pair: { id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } } | null, contents: Array<{ quantity: number, product: { images: Array<string>, id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } } }>, crosses?: Array<{ id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } }>, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null }, catalogueCandidates?: { byProductId: { id: string, sku: string, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> } | null } };

export type CatalogueSearchQueryVariables = Exact<{
  input: CatalogueSearchInput;
}>;


export type CatalogueSearchQuery = { catalogue: { search: { products: { total: number, items: Array<{ item: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null }, highlights: { items: Array<{ field: string, fragments: Array<string> }> } | null }> }, catalogues: { total: number, items: Array<{ item: { id: string, sku: string, producer: { id: number, name: string }, supplierProducts: Array<{ names: Array<{ name: string }> }> }, highlights: { items: Array<{ field: string, fragments: Array<string> }> } | null }> } } } };

export type ProducerSearchQueryVariables = Exact<{
  input: ProducerSearchInput;
}>;


export type ProducerSearchQuery = { producers: { search: Array<{ id: number, name: string, description: string | null }> } };

export type ProductGroupsSearchQueryVariables = Exact<{
  input: SearchProductGroupsInput;
}>;


export type ProductGroupsSearchQuery = { productGroups: { search: Array<{ id: number, name: string, normalizedName: string }> } };

export type ProductGroupsByIdsQueryVariables = Exact<{
  ids: Array<number> | number;
}>;


export type ProductGroupsByIdsQuery = { productGroups: { byIds: Array<{ id: number, name: string, normalizedName: string }> } };

export type CharacteristicsSearchQueryVariables = Exact<{
  input: SearchCharacteristicsInput;
}>;


export type CharacteristicsSearchQuery = { characteristics: { search: Array<{ id: number, name: string, normalizedName: string }> } };

export type CharacteristicsByIdsQueryVariables = Exact<{
  ids: Array<number> | number;
}>;


export type CharacteristicsByIdsQuery = { characteristics: { byIds: Array<{ id: number, name: string, normalizedName: string }> } };

export type CharacteristicUpsertMutationVariables = Exact<{
  input: UpsertCharacteristicInput;
}>;


export type CharacteristicUpsertMutation = { characteristics: { upsert: { id: number, name: string, normalizedName: string } } };

export type CharacteristicDeleteMutationVariables = Exact<{
  id: number;
}>;


export type CharacteristicDeleteMutation = { characteristics: { delete: boolean } };

export type ProductGroupUpsertMutationVariables = Exact<{
  input: UpsertProductGroupInput;
}>;


export type ProductGroupUpsertMutation = { productGroups: { upsert: { id: number, name: string, normalizedName: string } } };

export type ProductPatchMutationVariables = Exact<{
  productId: number;
  input: PatchProductInput;
}>;


export type ProductPatchMutation = { products: { patch: { id: number } } };

export type ProductDeleteMutationVariables = Exact<{
  input: DeleteProductInput;
}>;


export type ProductDeleteMutation = { products: { delete: boolean } };

export type ProductCreateMutationVariables = Exact<{
  products: Array<CreateProductInput> | CreateProductInput;
}>;


export type ProductCreateMutation = { products: { create: Array<{ id: number, sku: string, name: string }> } };

export type ProductEanCreateMutationVariables = Exact<{
  input: ProductEanInput;
}>;


export type ProductEanCreateMutation = { productEans: { create: boolean } };

export type ProductEanDeleteMutationVariables = Exact<{
  input: ProductEanInput;
}>;


export type ProductEanDeleteMutation = { productEans: { delete: boolean } };

export type ProducersByIdsQueryVariables = Exact<{
  ids: Array<number> | number;
}>;


export type ProducersByIdsQuery = { producers: { byIds: Array<{ id: number, name: string, description: string | null }> } };

export type CatalogueCandidatesForReviewQueryVariables = Exact<{
  input: CatalogueSearchInput;
}>;


export type CatalogueCandidatesForReviewQuery = { catalogue: { search: { catalogues: { total: number, items: Array<{ item: { id: string, sku: string, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> } }> } } } };

export type CatalogueCandidateByIdQueryVariables = Exact<{
  id: string;
}>;


export type CatalogueCandidateByIdQuery = { catalogueCandidates: { byId: { id: string, sku: string, crosses: { mapped: Array<{ id: string, sku: string, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> }>, notMapped: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> }, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> } | null } };

export type CatalogueCandidateByProductIdQueryVariables = Exact<{
  productId: number;
}>;


export type CatalogueCandidateByProductIdQuery = { catalogueCandidates: { byProductId: { id: string, sku: string, crosses: { mapped: Array<{ id: string, sku: string, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> }>, notMapped: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> }, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> } | null } };

export type CandidateToCatalogueMutationVariables = Exact<{
  input: CandidateToCatalogueInput;
}>;


export type CandidateToCatalogueMutation = { catalogueCandidates: { candidateToCatalogue: { id: number } } };

export type MapCandidateCrossesMutationVariables = Exact<{
  input: MaxCandidateCrossesInput;
}>;


export type MapCandidateCrossesMutation = { catalogueCandidates: { mapCrosses: Array<{ id: string, sku: string, crosses: { mapped: Array<{ id: string, sku: string, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> }>, notMapped: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> }, producer: { id: number, name: string, description: string | null }, product: { id: number, sku: string, name: string, description: string | null, indicator: string | null, images: Array<string>, stock: number, producer: { id: number, name: string, description: string | null, aliases: Array<string> }, group: { id: number, name: string } | null, size: { length: number, width: number, height: number, unit: DimensionUnit, volumeM3: number } | null, weight: { weight: number, unit: WeightUnit } | null } | null, supplierProducts: Array<{ id: number, candidateId: string | null, sku: string, producer: string, supplier: Supplier, names: Array<{ id: number, supplierProductId: number, name: string }> }> }> } };

export type ProductAvailableStockQueryVariables = Exact<{
  id: number;
  input: ProductAvailableStocksInput;
}>;


export type ProductAvailableStockQuery = { products: { byId: { id: number, availableStock: number } | null } };

export type ProductsAvailableStockQueryVariables = Exact<{
  ids: Array<number> | number;
  input: ProductAvailableStocksInput;
}>;


export type ProductsAvailableStockQuery = { products: { byIds: Array<{ id: number, availableStock: number }> } };

export type ProductPairQueryVariables = Exact<{
  id: number;
}>;


export type ProductPairQuery = { products: { byId: { id: number, pair: { id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } } | null } | null } };

export type ProductContentsQueryVariables = Exact<{
  id: number;
}>;


export type ProductContentsQuery = { products: { byId: { id: number, contents: Array<{ quantity: number, product: { images: Array<string>, id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } } }> } | null } };

export type ResolveProductReferencesQueryVariables = Exact<{
  references: Array<ProductReferenceInput> | ProductReferenceInput;
}>;


export type ResolveProductReferencesQuery = { products: { resolve: Array<{ sku: string, producerName: string, supplier: Supplier | null, productId: number | null, producer: { id: number, name: string } | null, product: { id: number, sku: string, name: string } | null }> } };

export type ProductCrossesQueryVariables = Exact<{
  id: number;
  input: ProductCrossesInput;
}>;


export type ProductCrossesQuery = { products: { byId: { id: number, crosses: Array<{ id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } }> } | null } };

export type ProductStorageContentsQueryVariables = Exact<{
  id: number;
  input: ProductStorageContentsInput;
}>;


export type ProductStorageContentsQuery = { products: { byId: { id: number, storageContents: Array<{ id: number, rowVersion: number, count: number, buyPrice: number, purchaseDatetime: string, currency: { id: number, code: string, name: string, shortName: string, sign: string }, storage: { code: string, description: string | null, location: string | null, type: StorageType }, product: { id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } } }> } | null } };

export type StorageContentsSearchQueryVariables = Exact<{
  input: StorageContentsSearchInput;
}>;


export type StorageContentsSearchQuery = { storageContents: { search: Array<{ id: number, rowVersion: number, count: number, buyPrice: number, purchaseDatetime: string, currency: { id: number, code: string, name: string, shortName: string, sign: string }, storage: { code: string, description: string | null, location: string | null, type: StorageType }, product: { id: number, sku: string, name: string, indicator: string | null, stock: number, producer: { id: number, name: string } } }> } };

export const ManagedProducerFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManagedProducer"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Producer"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<ManagedProducerFragment, unknown>;
export const ManagedRoleFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManagedRole"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Role"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"localizedName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"whoCreated"}},{"kind":"Field","name":{"kind":"Name","value":"whoUpdated"}}]}}]} as unknown as DocumentNode<ManagedRoleFragment, unknown>;
export const ManagedStorageFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManagedStorage"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Storage"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<ManagedStorageFragment, unknown>;
export const ChartSchemaFieldFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChartSchemaField"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FieldSchema"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"labelKey"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"descriptionKey"}},{"kind":"Field","name":{"kind":"Name","value":"control"}},{"kind":"Field","name":{"kind":"Name","value":"accepts"}},{"kind":"Field","name":{"kind":"Name","value":"dependency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entityName"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}}]}}]}}]} as unknown as DocumentNode<ChartSchemaFieldFragment, unknown>;
export const ChartSchemaFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChartSchema"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ObjectSchema"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchemaField"}},{"kind":"Field","name":{"kind":"Name","value":"nestedSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchemaField"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChartSchemaField"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FieldSchema"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"labelKey"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"descriptionKey"}},{"kind":"Field","name":{"kind":"Name","value":"control"}},{"kind":"Field","name":{"kind":"Name","value":"accepts"}},{"kind":"Field","name":{"kind":"Name","value":"dependency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entityName"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}}]}}]}}]} as unknown as DocumentNode<ChartSchemaFragment, unknown>;
export const DeliveryScheduleFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeliveryScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliverySchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"storageCode"}},{"kind":"Field","name":{"kind":"Name","value":"days"}},{"kind":"Field","name":{"kind":"Name","value":"arrivalTime"}},{"kind":"Field","name":{"kind":"Name","value":"exceptions"}}]}}]} as unknown as DocumentNode<DeliveryScheduleFieldsFragment, unknown>;
export const DocumentGenerationRequestFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentGenerationRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentGenerationRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"job"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"documentSystemName"}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"fileLink"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAtUtc"}}]}}]}}]} as unknown as DocumentNode<DocumentGenerationRequestFieldsFragment, unknown>;
export const JobFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Job"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isStep"}},{"kind":"Field","name":{"kind":"Name","value":"stepKey"}},{"kind":"Field","name":{"kind":"Name","value":"inputInitialized"}},{"kind":"Field","name":{"kind":"Name","value":"multiStepJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"attempts"}},{"kind":"Field","name":{"kind":"Name","value":"maxAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"lockedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<JobFieldsFragment, unknown>;
export const JobScheduleFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"JobSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"jobInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"inputState"}},{"kind":"Field","name":{"kind":"Name","value":"maxAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"cron"}},{"kind":"Field","name":{"kind":"Name","value":"localizedCron"}},{"kind":"Field","name":{"kind":"Name","value":"lastQueuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"nextRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]} as unknown as DocumentNode<JobScheduleFieldsFragment, unknown>;
export const NotificationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"seenAt"}}]}}]} as unknown as DocumentNode<NotificationFieldsFragment, unknown>;
export const OperationUserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<OperationUserFragment, unknown>;
export const OperationOrganizationFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<OperationOrganizationFragment, unknown>;
export const OperationCurrencyFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}}]} as unknown as DocumentNode<OperationCurrencyFragment, unknown>;
export const SaleFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SaleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sale"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"saleDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}}]} as unknown as DocumentNode<SaleFieldsFragment, unknown>;
export const SaleContentFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SaleContentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SaleContent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"originalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"discountedPrice"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"saleContentId"}},{"kind":"Field","name":{"kind":"Name","value":"storageContentId"}},{"kind":"Field","name":{"kind":"Name","value":"buyPrice"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}}]} as unknown as DocumentNode<SaleContentFieldsFragment, unknown>;
export const PurchaseFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Purchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}}]} as unknown as DocumentNode<PurchaseFieldsFragment, unknown>;
export const PurchaseContentFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PurchaseContentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PurchaseContent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<PurchaseContentFieldsFragment, unknown>;
export const TransactionFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TransactionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Transaction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"transactionDate"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"isReversed"}},{"kind":"Field","name":{"kind":"Name","value":"reversedAt"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"receiver"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}}]} as unknown as DocumentNode<TransactionFieldsFragment, unknown>;
export const UserSummaryFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<UserSummaryFieldsFragment, unknown>;
export const UserDetailsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedUserName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"twoFactorEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"lockoutEnd"}},{"kind":"Field","name":{"kind":"Name","value":"accessFailedCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<UserDetailsFieldsFragment, unknown>;
export const UserEmailFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserEmailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserEmail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"confirmed"}},{"kind":"Field","name":{"kind":"Name","value":"emailType"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"confirmedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserEmailFieldsFragment, unknown>;
export const OrganizationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<OrganizationFieldsFragment, unknown>;
export const OrganizationFinancesFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFinancesFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationFinances"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"financialProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"minimalAllowedBalance"}},{"kind":"Field","name":{"kind":"Name","value":"netPositionInBaseCurrency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"balances"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}}]}}]}}]} as unknown as DocumentNode<OrganizationFinancesFieldsFragment, unknown>;
export const MarkupGroupFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MarkupGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarkupGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceMessageId"}}]}}]} as unknown as DocumentNode<MarkupGroupFieldsFragment, unknown>;
export const MarkupRangeFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MarkupRangeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarkupRange"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rangeStart"}},{"kind":"Field","name":{"kind":"Name","value":"rangeEnd"}},{"kind":"Field","name":{"kind":"Name","value":"markup"}}]}}]} as unknown as DocumentNode<MarkupRangeFieldsFragment, unknown>;
export const PriceApplierFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PriceApplierFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PriceApplier"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isDynamic"}},{"kind":"Field","name":{"kind":"Name","value":"dslLogic"}},{"kind":"Field","name":{"kind":"Name","value":"states"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"priceApplierSystemName"}},{"kind":"Field","name":{"kind":"Name","value":"usage"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<PriceApplierFieldsFragment, unknown>;
export const ProductFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}}]} as unknown as DocumentNode<ProductFieldsFragment, unknown>;
export const ProductListFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ProductListFieldsFragment, unknown>;
export const ProductDetailsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"eans"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeEans"}}}]}]},{"kind":"Field","name":{"kind":"Name","value":"characteristics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"characteristic"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pair"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductListFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductListFields"}},{"kind":"Field","name":{"kind":"Name","value":"images"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"crosses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"crossesInput"}}}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeCrosses"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductListFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ProductDetailsFieldsFragment, unknown>;
export const SupplierProductFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupplierProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupplierProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"candidateId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"names"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplierProductId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<SupplierProductFieldsFragment, unknown>;
export const CatalogueCandidateReviewFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupplierProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupplierProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"candidateId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"names"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplierProductId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CatalogueCandidateReviewFieldsFragment, unknown>;
export const CatalogueCandidateCrossFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateCrossFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupplierProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupplierProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"candidateId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"names"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplierProductId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<CatalogueCandidateCrossFieldsFragment, unknown>;
export const CatalogueCandidateDetailsFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"}},{"kind":"Field","name":{"kind":"Name","value":"crosses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapped"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateCrossFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"notMapped"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupplierProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupplierProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"candidateId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"names"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplierProductId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateCrossFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}}]} as unknown as DocumentNode<CatalogueCandidateDetailsFieldsFragment, unknown>;
export const CatalogueCandidateSearchFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateSearchFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"names"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CatalogueCandidateSearchFieldsFragment, unknown>;
export const ManagedProducersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ManagedProducers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetProducersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ManagedProducer"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManagedProducer"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Producer"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<ManagedProducersQuery, ManagedProducersQueryVariables>;
export const CreateProducerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProducer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProducerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ManagedProducer"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManagedProducer"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Producer"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<CreateProducerMutation, CreateProducerMutationVariables>;
export const EditProducerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditProducer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"producerId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PatchProducerInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"producerId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"producerId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ManagedProducer"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManagedProducer"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Producer"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<EditProducerMutation, EditProducerMutationVariables>;
export const DeleteProducerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProducer"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteProducerMutation, DeleteProducerMutationVariables>;
export const ProducerAliasesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProducerAliases"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}}]}}]}}]} as unknown as DocumentNode<ProducerAliasesQuery, ProducerAliasesQueryVariables>;
export const AddProducerAliasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddProducerAlias"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProducerAliasInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addAlias"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<AddProducerAliasMutation, AddProducerAliasMutationVariables>;
export const DeleteProducerAliasDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProducerAlias"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProducerAliasInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteAlias"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteProducerAliasMutation, DeleteProducerAliasMutationVariables>;
export const ProducerSupplierMappingsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProducerSupplierMappings"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplierMappings"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducerName"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProducerSupplierMappingsQuery, ProducerSupplierMappingsQueryVariables>;
export const CreateProducerSupplierMappingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProducerSupplierMapping"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProducerSupplierMappingInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSupplierMapping"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducerName"}}]}}]}}]}}]} as unknown as DocumentNode<CreateProducerSupplierMappingMutation, CreateProducerSupplierMappingMutationVariables>;
export const DeleteProducerSupplierMappingDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProducerSupplierMapping"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSupplierMapping"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteProducerSupplierMappingMutation, DeleteProducerSupplierMappingMutationVariables>;
export const AllCurrenciesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AllCurrencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}}]} as unknown as DocumentNode<AllCurrenciesQuery, AllCurrenciesQueryVariables>;
export const BaseCurrencyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"BaseCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"base"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}}]} as unknown as DocumentNode<BaseCurrencyQuery, BaseCurrencyQueryVariables>;
export const CreateCurrencyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCurrency"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCurrencyInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CreateCurrencyMutation, CreateCurrencyMutationVariables>;
export const UpdateCurrencyRatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCurrencyRates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRates"}}]}}]}}]} as unknown as DocumentNode<UpdateCurrencyRatesMutation, UpdateCurrencyRatesMutationVariables>;
export const ManagedRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ManagedRoles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetRolesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ManagedRole"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManagedRole"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Role"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"localizedName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"whoCreated"}},{"kind":"Field","name":{"kind":"Name","value":"whoUpdated"}}]}}]} as unknown as DocumentNode<ManagedRolesQuery, ManagedRolesQueryVariables>;
export const ManagedRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ManagedRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ManagedRole"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManagedRole"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Role"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"localizedName"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"whoCreated"}},{"kind":"Field","name":{"kind":"Name","value":"whoUpdated"}}]}}]} as unknown as DocumentNode<ManagedRoleQuery, ManagedRoleQueryVariables>;
export const UpsertRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}}]}}]}}]}}]} as unknown as DocumentNode<UpsertRoleMutation, UpsertRoleMutationVariables>;
export const AddPermissionToRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddPermissionToRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddPermissionToRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"roles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addPermission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}}]}}]}}]}}]} as unknown as DocumentNode<AddPermissionToRoleMutation, AddPermissionToRoleMutationVariables>;
export const EmailOptionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EmailOptions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"options"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"emails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"maxEmailCount"}},{"kind":"Field","name":{"kind":"Name","value":"minEmailCount"}}]}}]}}]}}]} as unknown as DocumentNode<EmailOptionsQuery, EmailOptionsQueryVariables>;
export const ManagedStoragesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ManagedStorages"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetStoragesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ManagedStorage"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManagedStorage"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Storage"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<ManagedStoragesQuery, ManagedStoragesQueryVariables>;
export const ManagedStorageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ManagedStorage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byCode"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ManagedStorage"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ManagedStorage"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Storage"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}}]} as unknown as DocumentNode<ManagedStorageQuery, ManagedStorageQueryVariables>;
export const CreateStorageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateStorage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateStorageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]}}]}}]} as unknown as DocumentNode<CreateStorageMutation, CreateStorageMutationVariables>;
export const EditStorageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditStorage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PatchStorageInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]}}]}}]} as unknown as DocumentNode<EditStorageMutation, EditStorageMutationVariables>;
export const DeleteStorageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteStorage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"code"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"code"},"value":{"kind":"Variable","name":{"kind":"Name","value":"code"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteStorageMutation, DeleteStorageMutationVariables>;
export const AddStorageContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddStorageContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddStorageContentInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storageContents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"add"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<AddStorageContentMutation, AddStorageContentMutationVariables>;
export const EditStorageContentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditStorageContents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"items"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EditStorageContentInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storageContents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"edit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"items"},"value":{"kind":"Variable","name":{"kind":"Name","value":"items"}}}]}]}}]}}]} as unknown as DocumentNode<EditStorageContentsMutation, EditStorageContentsMutationVariables>;
export const ZeroStorageContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ZeroStorageContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"rowVersion"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnsignedInt"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storageContents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setToZero"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"contentId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"contentId"}}},{"kind":"Argument","name":{"kind":"Name","value":"rowVersion"},"value":{"kind":"Variable","name":{"kind":"Name","value":"rowVersion"}}}]}]}}]}}]} as unknown as DocumentNode<ZeroStorageContentMutation, ZeroStorageContentMutationVariables>;
export const UploadsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Uploads"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetUploadsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"lastModified"}},{"kind":"Field","name":{"kind":"Name","value":"fullPath"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}},{"kind":"Field","name":{"kind":"Name","value":"hasMore"}}]}}]}}]}}]} as unknown as DocumentNode<UploadsQuery, UploadsQueryVariables>;
export const CreateUploadRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUploadRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUploadRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<CreateUploadRequestMutation, CreateUploadRequestMutationVariables>;
export const CompleteUploadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CompleteUpload"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"fileName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"uploads"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"complete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"fileName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"fileName"}}}]}]}}]}}]} as unknown as DocumentNode<CompleteUploadMutation, CompleteUploadMutationVariables>;
export const AddProductContentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddProductContents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"items"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductContentItemInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"productId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productId"}}},{"kind":"Argument","name":{"kind":"Name","value":"items"},"value":{"kind":"Variable","name":{"kind":"Name","value":"items"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<AddProductContentsMutation, AddProductContentsMutationVariables>;
export const RemoveProductContentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveProductContent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"childProductId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeContent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"productId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productId"}}},{"kind":"Argument","name":{"kind":"Name","value":"childProductId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"childProductId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveProductContentMutation, RemoveProductContentMutationVariables>;
export const SetProductContentCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetProductContentCount"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"childProductId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"quantity"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setContentCount"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"productId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productId"}}},{"kind":"Argument","name":{"kind":"Name","value":"childProductId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"childProductId"}}},{"kind":"Argument","name":{"kind":"Name","value":"quantity"},"value":{"kind":"Variable","name":{"kind":"Name","value":"quantity"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<SetProductContentCountMutation, SetProductContentCountMutationVariables>;
export const UpsertProductCharacteristicsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertProductCharacteristics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"items"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertProductCharacteristicInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertCharacteristics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"items"},"value":{"kind":"Variable","name":{"kind":"Name","value":"items"}}}]}]}}]}}]} as unknown as DocumentNode<UpsertProductCharacteristicsMutation, UpsertProductCharacteristicsMutationVariables>;
export const DeleteProductCharacteristicDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProductCharacteristic"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"characteristicId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCharacteristic"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"productId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productId"}}},{"kind":"Argument","name":{"kind":"Name","value":"characteristicId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"characteristicId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteProductCharacteristicMutation, DeleteProductCharacteristicMutationVariables>;
export const CreateProductCrossesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateProductCrosses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"linkages"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductLinkageInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCrosses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"linkages"},"value":{"kind":"Variable","name":{"kind":"Name","value":"linkages"}}}]}]}}]}}]} as unknown as DocumentNode<CreateProductCrossesMutation, CreateProductCrossesMutationVariables>;
export const RemoveProductImageDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveProductImage"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"imagePath"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeImage"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"productId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productId"}}},{"kind":"Argument","name":{"kind":"Name","value":"imagePath"},"value":{"kind":"Variable","name":{"kind":"Name","value":"imagePath"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveProductImageMutation, RemoveProductImageMutationVariables>;
export const ProductMeasurementsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductMeasurements"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProductMeasurementsQuery, ProductMeasurementsQueryVariables>;
export const SetProductSizeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetProductSize"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetProductSizeInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setSize"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<SetProductSizeMutation, SetProductSizeMutationVariables>;
export const DeleteProductSizeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProductSize"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSize"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"productId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteProductSizeMutation, DeleteProductSizeMutationVariables>;
export const SetProductWeightDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetProductWeight"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetProductWeightInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setWeight"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<SetProductWeightMutation, SetProductWeightMutationVariables>;
export const DeleteProductWeightDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteProductWeight"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteWeight"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"productId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<DeleteProductWeightMutation, DeleteProductWeightMutationVariables>;
export const AvailableChartsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AvailableCharts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"charts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"queryInputSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchema"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataPointSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchema"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChartSchemaField"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FieldSchema"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"labelKey"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"descriptionKey"}},{"kind":"Field","name":{"kind":"Name","value":"control"}},{"kind":"Field","name":{"kind":"Name","value":"accepts"}},{"kind":"Field","name":{"kind":"Name","value":"dependency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entityName"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChartSchema"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ObjectSchema"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchemaField"}},{"kind":"Field","name":{"kind":"Name","value":"nestedSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchemaField"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AvailableChartsQuery, AvailableChartsQueryVariables>;
export const AvailableAnalysesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AvailableAnalyses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analyses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<AvailableAnalysesQuery, AvailableAnalysesQueryVariables>;
export const AnalysisDefinitionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AnalysisDefinition"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analysis"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"systemName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"lrtSystemName"}},{"kind":"Field","name":{"kind":"Name","value":"itemsChartSystemName"}},{"kind":"Field","name":{"kind":"Name","value":"schemaVersion"}},{"kind":"Field","name":{"kind":"Name","value":"parametersSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchema"}}]}},{"kind":"Field","name":{"kind":"Name","value":"summarySchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchema"}}]}},{"kind":"Field","name":{"kind":"Name","value":"segmentsSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchema"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchema"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChartSchemaField"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FieldSchema"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"labelKey"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"descriptionKey"}},{"kind":"Field","name":{"kind":"Name","value":"control"}},{"kind":"Field","name":{"kind":"Name","value":"accepts"}},{"kind":"Field","name":{"kind":"Name","value":"dependency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entityName"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChartSchema"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ObjectSchema"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchemaField"}},{"kind":"Field","name":{"kind":"Name","value":"nestedSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchemaField"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AnalysisDefinitionQuery, AnalysisDefinitionQueryVariables>;
export const AnalysisItemsDefinitionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AnalysisItemsDefinition"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"systemName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"queryInputSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchema"}}]}},{"kind":"Field","name":{"kind":"Name","value":"dataPointSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchema"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChartSchemaField"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FieldSchema"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"labelKey"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"descriptionKey"}},{"kind":"Field","name":{"kind":"Name","value":"control"}},{"kind":"Field","name":{"kind":"Name","value":"accepts"}},{"kind":"Field","name":{"kind":"Name","value":"dependency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entityName"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChartSchema"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ObjectSchema"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchemaField"}},{"kind":"Field","name":{"kind":"Name","value":"nestedSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchemaField"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AnalysisItemsDefinitionQuery, AnalysisItemsDefinitionQueryVariables>;
export const SetAnalyticsRunPinnedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SetAnalyticsRunPinned"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"isPinned"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"setRunPinned"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"runId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runId"}}},{"kind":"Argument","name":{"kind":"Name","value":"isPinned"},"value":{"kind":"Variable","name":{"kind":"Name","value":"isPinned"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}}]}}]}}]}}]} as unknown as DocumentNode<SetAnalyticsRunPinnedMutation, SetAnalyticsRunPinnedMutationVariables>;
export const AnalyticsRunDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AnalyticsRunDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"run"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"analysisType"}},{"kind":"Field","name":{"kind":"Name","value":"schemaVersion"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"periodStart"}},{"kind":"Field","name":{"kind":"Name","value":"periodEnd"}},{"kind":"Field","name":{"kind":"Name","value":"itemsCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}},{"kind":"Field","name":{"kind":"Name","value":"jobId"}},{"kind":"Field","name":{"kind":"Name","value":"parameters"}},{"kind":"Field","name":{"kind":"Name","value":"summary"}}]}}]}}]}}]} as unknown as DocumentNode<AnalyticsRunDetailsQuery, AnalyticsRunDetailsQueryVariables>;
export const AnalysisRunItemsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AnalysisRunItems"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"queryInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Any"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"products"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"organizations"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"users"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"systemName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"queryInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"queryInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"points"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"references"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"entity"}},{"kind":"Field","name":{"kind":"Name","value":"target"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"products"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"productId"},"name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"organizations"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"organizationId"},"name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"users"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"userId"},"name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}}]}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AnalysisRunItemsQuery, AnalysisRunItemsQueryVariables>;
export const AnalyticsRunsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AnalyticsRuns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetAnalyticsRunsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"analysisType"}},{"kind":"Field","name":{"kind":"Name","value":"schemaVersion"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"periodStart"}},{"kind":"Field","name":{"kind":"Name","value":"periodEnd"}},{"kind":"Field","name":{"kind":"Name","value":"itemsCount"}},{"kind":"Field","name":{"kind":"Name","value":"isPinned"}}]}}]}}]}}]} as unknown as DocumentNode<AnalyticsRunsQuery, AnalyticsRunsQueryVariables>;
export const SalesProfitChartDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SalesProfitChart"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"queryInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Any"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"analytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chart"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"systemName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"queryInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"queryInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"points"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nextCursor"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SalesProfitChartQuery, SalesProfitChartQueryVariables>;
export const CurrencyHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CurrencyHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currencies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"history"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rate"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"fromCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"Field","name":{"kind":"Name","value":"toCurrency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<CurrencyHistoryQuery, CurrencyHistoryQueryVariables>;
export const SearchDeliverySchedulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchDeliverySchedules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchDeliverySchedulesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliverySchedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeliveryScheduleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeliveryScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliverySchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"storageCode"}},{"kind":"Field","name":{"kind":"Name","value":"days"}},{"kind":"Field","name":{"kind":"Name","value":"arrivalTime"}},{"kind":"Field","name":{"kind":"Name","value":"exceptions"}}]}}]} as unknown as DocumentNode<SearchDeliverySchedulesQuery, SearchDeliverySchedulesQueryVariables>;
export const CreateDeliveryScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDeliverySchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateDeliveryScheduleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliverySchedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeliveryScheduleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeliveryScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliverySchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"storageCode"}},{"kind":"Field","name":{"kind":"Name","value":"days"}},{"kind":"Field","name":{"kind":"Name","value":"arrivalTime"}},{"kind":"Field","name":{"kind":"Name","value":"exceptions"}}]}}]} as unknown as DocumentNode<CreateDeliveryScheduleMutation, CreateDeliveryScheduleMutationVariables>;
export const UpdateDeliveryScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateDeliverySchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateDeliveryScheduleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliverySchedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeliveryScheduleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeliveryScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliverySchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"storageCode"}},{"kind":"Field","name":{"kind":"Name","value":"days"}},{"kind":"Field","name":{"kind":"Name","value":"arrivalTime"}},{"kind":"Field","name":{"kind":"Name","value":"exceptions"}}]}}]} as unknown as DocumentNode<UpdateDeliveryScheduleMutation, UpdateDeliveryScheduleMutationVariables>;
export const DeleteDeliveryScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteDeliverySchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"supplier"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Supplier"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"storageCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliverySchedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"supplier"},"value":{"kind":"Variable","name":{"kind":"Name","value":"supplier"}}},{"kind":"Argument","name":{"kind":"Name","value":"storageCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"storageCode"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteDeliveryScheduleMutation, DeleteDeliveryScheduleMutationVariables>;
export const AddDeliveryScheduleExceptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddDeliveryScheduleException"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryScheduleExceptionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliverySchedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addException"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeliveryScheduleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeliveryScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliverySchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"storageCode"}},{"kind":"Field","name":{"kind":"Name","value":"days"}},{"kind":"Field","name":{"kind":"Name","value":"arrivalTime"}},{"kind":"Field","name":{"kind":"Name","value":"exceptions"}}]}}]} as unknown as DocumentNode<AddDeliveryScheduleExceptionMutation, AddDeliveryScheduleExceptionMutationVariables>;
export const RemoveDeliveryScheduleExceptionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveDeliveryScheduleException"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeliveryScheduleExceptionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deliverySchedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeException"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DeliveryScheduleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DeliveryScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DeliverySchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"storageCode"}},{"kind":"Field","name":{"kind":"Name","value":"days"}},{"kind":"Field","name":{"kind":"Name","value":"arrivalTime"}},{"kind":"Field","name":{"kind":"Name","value":"exceptions"}}]}}]} as unknown as DocumentNode<RemoveDeliveryScheduleExceptionMutation, RemoveDeliveryScheduleExceptionMutationVariables>;
export const SaleCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SaleCreated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onSaleCreated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sale"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SaleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SaleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sale"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"saleDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<SaleCreatedSubscription, SaleCreatedSubscriptionVariables>;
export const SaleUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SaleUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onSaleUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sale"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SaleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SaleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sale"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"saleDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<SaleUpdatedSubscription, SaleUpdatedSubscriptionVariables>;
export const SaleDeletedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SaleDeleted"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onSaleDeleted"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sale"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SaleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SaleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sale"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"saleDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<SaleDeletedSubscription, SaleDeletedSubscriptionVariables>;
export const PurchaseCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PurchaseCreated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onPurchaseCreated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchase"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PurchaseFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Purchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<PurchaseCreatedSubscription, PurchaseCreatedSubscriptionVariables>;
export const PurchaseUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PurchaseUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onPurchaseUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchase"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PurchaseFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Purchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<PurchaseUpdatedSubscription, PurchaseUpdatedSubscriptionVariables>;
export const PurchaseDeletedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"PurchaseDeleted"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onPurchaseDeleted"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchaseId"}}]}}]}}]} as unknown as DocumentNode<PurchaseDeletedSubscription, PurchaseDeletedSubscriptionVariables>;
export const AvailableDocumentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AvailableDocuments"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"available"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"documentGroup"}},{"kind":"Field","name":{"kind":"Name","value":"supportedDocumentTypes"}},{"kind":"Field","name":{"kind":"Name","value":"requestSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"control"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"labelKey"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"descriptionKey"}},{"kind":"Field","name":{"kind":"Name","value":"accepts"}},{"kind":"Field","name":{"kind":"Name","value":"dependency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entityName"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"nestedSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"control"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"accepts"}}]}}]}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<AvailableDocumentsQuery, AvailableDocumentsQueryVariables>;
export const CreateDocumentGenerationRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateDocumentGenerationRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateGenerationRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createGenerationRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentGenerationRequestFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentGenerationRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentGenerationRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"job"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"documentSystemName"}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"fileLink"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAtUtc"}}]}}]}}]} as unknown as DocumentNode<CreateDocumentGenerationRequestMutation, CreateDocumentGenerationRequestMutationVariables>;
export const DocumentByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DocumentById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentGenerationRequestFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentGenerationRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentGenerationRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"job"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"documentSystemName"}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"fileLink"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAtUtc"}}]}}]}}]} as unknown as DocumentNode<DocumentByIdQuery, DocumentByIdQueryVariables>;
export const DocumentsByIdsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DocumentsByIds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byIds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentGenerationRequestFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentGenerationRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentGenerationRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"job"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"documentSystemName"}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"fileLink"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAtUtc"}}]}}]}}]} as unknown as DocumentNode<DocumentsByIdsQuery, DocumentsByIdsQueryVariables>;
export const SearchDocumentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchDocuments"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchDocumentsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"documents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentGenerationRequestFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentGenerationRequestFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"DocumentGenerationRequest"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestId"}},{"kind":"Field","name":{"kind":"Name","value":"job"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"documentSystemName"}},{"kind":"Field","name":{"kind":"Name","value":"requesterId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"generatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"fileLink"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"url"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAtUtc"}}]}}]}}]} as unknown as DocumentNode<SearchDocumentsQuery, SearchDocumentsQueryVariables>;
export const AvailableJobsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AvailableJobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"available"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"initStateSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchema"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChartSchemaField"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FieldSchema"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"required"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"labelKey"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"descriptionKey"}},{"kind":"Field","name":{"kind":"Name","value":"control"}},{"kind":"Field","name":{"kind":"Name","value":"accepts"}},{"kind":"Field","name":{"kind":"Name","value":"dependency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"entityName"}},{"kind":"Field","name":{"kind":"Name","value":"fieldName"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChartSchema"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ObjectSchema"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchemaField"}},{"kind":"Field","name":{"kind":"Name","value":"nestedSchema"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"version"}},{"kind":"Field","name":{"kind":"Name","value":"fields"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ChartSchemaField"}}]}}]}}]}}]}}]} as unknown as DocumentNode<AvailableJobsQuery, AvailableJobsQueryVariables>;
export const SearchJobsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchJobs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchJobsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Job"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isStep"}},{"kind":"Field","name":{"kind":"Name","value":"stepKey"}},{"kind":"Field","name":{"kind":"Name","value":"inputInitialized"}},{"kind":"Field","name":{"kind":"Name","value":"multiStepJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"attempts"}},{"kind":"Field","name":{"kind":"Name","value":"maxAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"lockedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<SearchJobsQuery, SearchJobsQueryVariables>;
export const JobByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"JobById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Job"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isStep"}},{"kind":"Field","name":{"kind":"Name","value":"stepKey"}},{"kind":"Field","name":{"kind":"Name","value":"inputInitialized"}},{"kind":"Field","name":{"kind":"Name","value":"multiStepJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"attempts"}},{"kind":"Field","name":{"kind":"Name","value":"maxAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"lockedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<JobByIdQuery, JobByIdQueryVariables>;
export const JobStateByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"JobStateById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"state"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"inputInitialized"}},{"kind":"Field","name":{"kind":"Name","value":"output"}}]}}]}}]}}]}}]} as unknown as DocumentNode<JobStateByIdQuery, JobStateByIdQueryVariables>;
export const CreateJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateJobInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Job"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isStep"}},{"kind":"Field","name":{"kind":"Name","value":"stepKey"}},{"kind":"Field","name":{"kind":"Name","value":"inputInitialized"}},{"kind":"Field","name":{"kind":"Name","value":"multiStepJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"attempts"}},{"kind":"Field","name":{"kind":"Name","value":"maxAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"lockedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<CreateJobMutation, CreateJobMutationVariables>;
export const CancelJobDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelJob"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancel"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<CancelJobMutation, CancelJobMutationVariables>;
export const SearchJobSchedulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchJobSchedules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchJobSchedulesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobSchedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobScheduleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"JobSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"jobInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"inputState"}},{"kind":"Field","name":{"kind":"Name","value":"maxAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"cron"}},{"kind":"Field","name":{"kind":"Name","value":"localizedCron"}},{"kind":"Field","name":{"kind":"Name","value":"lastQueuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"nextRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]} as unknown as DocumentNode<SearchJobSchedulesQuery, SearchJobSchedulesQueryVariables>;
export const CreateJobScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateJobSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateJobScheduleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobSchedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobScheduleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"JobSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"jobInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"inputState"}},{"kind":"Field","name":{"kind":"Name","value":"maxAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"cron"}},{"kind":"Field","name":{"kind":"Name","value":"localizedCron"}},{"kind":"Field","name":{"kind":"Name","value":"lastQueuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"nextRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]} as unknown as DocumentNode<CreateJobScheduleMutation, CreateJobScheduleMutationVariables>;
export const UpdateJobScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateJobSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateJobScheduleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobSchedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobScheduleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobScheduleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"JobSchedule"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"jobInfo"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"inputState"}},{"kind":"Field","name":{"kind":"Name","value":"maxAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"cron"}},{"kind":"Field","name":{"kind":"Name","value":"localizedCron"}},{"kind":"Field","name":{"kind":"Name","value":"lastQueuedAt"}},{"kind":"Field","name":{"kind":"Name","value":"nextRunAt"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]} as unknown as DocumentNode<UpdateJobScheduleMutation, UpdateJobScheduleMutationVariables>;
export const RemoveJobScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveJobSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"jobSchedules"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"remove"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<RemoveJobScheduleMutation, RemoveJobScheduleMutationVariables>;
export const JobUpdatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"JobUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onJobUpdated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"job"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"JobFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"JobFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Job"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"isStep"}},{"kind":"Field","name":{"kind":"Name","value":"stepKey"}},{"kind":"Field","name":{"kind":"Name","value":"inputInitialized"}},{"kind":"Field","name":{"kind":"Name","value":"multiStepJob"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"attempts"}},{"kind":"Field","name":{"kind":"Name","value":"maxAttempts"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"lockedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<JobUpdatedSubscription, JobUpdatedSubscriptionVariables>;
export const NotificationsListDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NotificationsList"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ListNotificationsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"seenAt"}}]}}]} as unknown as DocumentNode<NotificationsListQuery, NotificationsListQueryVariables>;
export const MyNotificationPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyNotificationPreferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myPreferences"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"channelName"}},{"kind":"Field","name":{"kind":"Name","value":"localizableChannelName"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}}]}}]}}]} as unknown as DocumentNode<MyNotificationPreferencesQuery, MyNotificationPreferencesQueryVariables>;
export const SeeNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SeeNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"see"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}]}]}}]}}]} as unknown as DocumentNode<SeeNotificationsMutation, SeeNotificationsMutationVariables>;
export const UpsertNotificationPreferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpsertNotificationPreferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertNotificationPreferencesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsertPreferences"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<UpsertNotificationPreferencesMutation, UpsertNotificationPreferencesMutationVariables>;
export const NotificationCreatedDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"NotificationCreated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"onNotificationCreated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notification"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"text"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"seenAt"}}]}}]} as unknown as DocumentNode<NotificationCreatedSubscription, NotificationCreatedSubscriptionVariables>;
export const ListSalesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListSales"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetSalesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SaleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SaleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sale"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"saleDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<ListSalesQuery, ListSalesQueryVariables>;
export const SaleByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SaleById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SaleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SaleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sale"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"saleDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<SaleByIdQuery, SaleByIdQueryVariables>;
export const SaleByTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SaleByTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transactionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byTransactionId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"transactionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transactionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SaleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SaleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sale"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"saleDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<SaleByTransactionQuery, SaleByTransactionQueryVariables>;
export const SaleContentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SaleContents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SaleContentFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SaleContentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SaleContent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"originalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"discountedPrice"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"saleContentId"}},{"kind":"Field","name":{"kind":"Name","value":"storageContentId"}},{"kind":"Field","name":{"kind":"Name","value":"buyPrice"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]}}]} as unknown as DocumentNode<SaleContentsQuery, SaleContentsQueryVariables>;
export const ListPurchasesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListPurchases"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetPurchasesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchases"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PurchaseFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Purchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<ListPurchasesQuery, ListPurchasesQueryVariables>;
export const PurchaseByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PurchaseById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchases"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PurchaseFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Purchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<PurchaseByIdQuery, PurchaseByIdQueryVariables>;
export const PurchaseByTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PurchaseByTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transactionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchases"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byTransactionId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"transactionId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transactionId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PurchaseFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Purchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<PurchaseByTransactionQuery, PurchaseByTransactionQueryVariables>;
export const PurchaseContentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PurchaseContents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchases"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PurchaseContentFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PurchaseContentFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PurchaseContent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<PurchaseContentsQuery, PurchaseContentsQueryVariables>;
export const ListTransactionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListTransactions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetTransactionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TransactionFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TransactionFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Transaction"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"transactionDate"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"sourceType"}},{"kind":"Field","name":{"kind":"Name","value":"isCompleted"}},{"kind":"Field","name":{"kind":"Name","value":"isReversed"}},{"kind":"Field","name":{"kind":"Name","value":"reversedAt"}},{"kind":"Field","name":{"kind":"Name","value":"sender"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"receiver"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<ListTransactionsQuery, ListTransactionsQueryVariables>;
export const ProductSalesHistoryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductSalesHistory"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductSaleHistoryInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"saleHistory"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"saleContentId"}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"originalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"discountedPrice"}},{"kind":"Field","name":{"kind":"Name","value":"averageBuyPrice"}},{"kind":"Field","name":{"kind":"Name","value":"saleDate"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}}]} as unknown as DocumentNode<ProductSalesHistoryQuery, ProductSalesHistoryQueryVariables>;
export const CreateSaleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSale"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateSaleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SaleFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SaleFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Sale"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"buyer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"organization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"saleDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<CreateSaleMutation, CreateSaleMutationVariables>;
export const UpdateSaleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSale"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateSaleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateSaleMutation, UpdateSaleMutationVariables>;
export const DeleteSaleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSale"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteSaleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sales"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeleteSaleMutation, DeleteSaleMutationVariables>;
export const CreatePurchaseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreatePurchase"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreatePurchaseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchases"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PurchaseFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationOrganization"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OperationCurrency"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Currency"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PurchaseFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Purchase"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationUser"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierOrganization"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationOrganization"}}]}},{"kind":"Field","name":{"kind":"Name","value":"comment"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"totalSum"}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OperationCurrency"}}]}}]}}]} as unknown as DocumentNode<CreatePurchaseMutation, CreatePurchaseMutationVariables>;
export const UpdatePurchaseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdatePurchase"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdatePurchaseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchases"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<UpdatePurchaseMutation, UpdatePurchaseMutationVariables>;
export const DeletePurchaseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeletePurchase"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeletePurchaseInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"purchases"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<DeletePurchaseMutation, DeletePurchaseMutationVariables>;
export const CreateTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateTransactionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CreateTransactionMutation, CreateTransactionMutationVariables>;
export const ReverseTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ReverseTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReverseTransactionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"transactions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reverse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ReverseTransactionMutation, ReverseTransactionMutationVariables>;
export const ListUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetUsersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserDetailsFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedUserName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"twoFactorEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"lockoutEnd"}},{"kind":"Field","name":{"kind":"Name","value":"accessFailedCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}}]}}]} as unknown as DocumentNode<ListUsersQuery, ListUsersQueryVariables>;
export const SearchUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchUsersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserDetailsFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedUserName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"twoFactorEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"lockoutEnd"}},{"kind":"Field","name":{"kind":"Name","value":"accessFailedCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}}]}}]} as unknown as DocumentNode<SearchUsersQuery, SearchUsersQueryVariables>;
export const UserDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeInfo"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserDetailsFields"}},{"kind":"Field","name":{"kind":"Name","value":"emails"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInfo"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserEmailFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"phones"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInfo"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"number"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"isConfirmed"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}}]}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInfo"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"localizedName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"permissions"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeInfo"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedUserName"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"twoFactorEnabled"}},{"kind":"Field","name":{"kind":"Name","value":"lockoutEnd"}},{"kind":"Field","name":{"kind":"Name","value":"accessFailedCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastLoginAt"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserEmailFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserEmail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"confirmed"}},{"kind":"Field","name":{"kind":"Name","value":"emailType"}},{"kind":"Field","name":{"kind":"Name","value":"isPrimary"}},{"kind":"Field","name":{"kind":"Name","value":"confirmedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserDetailsQuery, UserDetailsQueryVariables>;
export const ListOrganizationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ListOrganizations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GetOrganizationsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}}]}}]}}]} as unknown as DocumentNode<ListOrganizationsQuery, ListOrganizationsQueryVariables>;
export const OrganizationByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrganizationById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}}]}}]}}]} as unknown as DocumentNode<OrganizationByIdQuery, OrganizationByIdQueryVariables>;
export const OrganizationMembersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrganizationMembers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationMembersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"members"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<OrganizationMembersQuery, OrganizationMembersQueryVariables>;
export const OrganizationFinancesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrganizationFinances"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"finances"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFinancesFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFinancesFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationFinances"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"financialProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"minimalAllowedBalance"}},{"kind":"Field","name":{"kind":"Name","value":"netPositionInBaseCurrency"}}]}},{"kind":"Field","name":{"kind":"Name","value":"balances"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","alias":{"kind":"Name","value":"currencySign"},"name":{"kind":"Name","value":"sign"}}]}}]}}]}}]} as unknown as DocumentNode<OrganizationFinancesQuery, OrganizationFinancesQueryVariables>;
export const OrganizationSystemNameAvailableDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"OrganizationSystemNameAvailable"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"isSystemNameAvailable"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"systemName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}}}]}]}}]}}]} as unknown as DocumentNode<OrganizationSystemNameAvailableQuery, OrganizationSystemNameAvailableQueryVariables>;
export const CreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateUserInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<CreateUserMutation, CreateUserMutationVariables>;
export const EditUserInfoDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditUserInfo"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"EditUserInfoInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editInfo"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]}}]} as unknown as DocumentNode<EditUserInfoMutation, EditUserInfoMutationVariables>;
export const AddUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AddUserEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<AddUserEmailMutation, AddUserEmailMutationVariables>;
export const RequestUserEmailVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestUserEmailVerification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestEmailVerification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<RequestUserEmailVerificationMutation, RequestUserEmailVerificationMutationVariables>;
export const RequestMyEmailVerificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RequestMyEmailVerification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"requestMyEmailVerification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}]}]}}]}}]} as unknown as DocumentNode<RequestMyEmailVerificationMutation, RequestMyEmailVerificationMutationVariables>;
export const MakeMyEmailPrimaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MakeMyEmailPrimary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"makeMyEmailPrimary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<MakeMyEmailPrimaryMutation, MakeMyEmailPrimaryMutationVariables>;
export const RemoveUserEmailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveUserEmail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeEmail"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveUserEmailMutation, RemoveUserEmailMutationVariables>;
export const MakeUserEmailPrimaryDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MakeUserEmailPrimary"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserEmailInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"makeEmailPrimary"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<MakeUserEmailPrimaryMutation, MakeUserEmailPrimaryMutationVariables>;
export const AddUserRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddUserRoles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserRolesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addRoles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<AddUserRolesMutation, AddUserRolesMutationVariables>;
export const RemoveUserRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveUserRoles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserRolesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeRoles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveUserRolesMutation, RemoveUserRolesMutationVariables>;
export const AddUserPermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddUserPermissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserPermissionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addPermissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<AddUserPermissionsMutation, AddUserPermissionsMutationVariables>;
export const RemoveUserPermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveUserPermissions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserPermissionsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removePermissions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveUserPermissionsMutation, RemoveUserPermissionsMutationVariables>;
export const CreateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateOrganizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}}]}}]}}]} as unknown as DocumentNode<CreateOrganizationMutation, CreateOrganizationMutationVariables>;
export const UpdateOrganizationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganization"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"update"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"OrganizationFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"OrganizationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Organization"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"isHidden"}},{"kind":"Field","name":{"kind":"Name","value":"approximateBalanceInBaseCurrency"}},{"kind":"Field","name":{"kind":"Name","value":"owner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}}]}}]}}]} as unknown as DocumentNode<UpdateOrganizationMutation, UpdateOrganizationMutationVariables>;
export const AddOrganizationMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AddOrganizationMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationMemberRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"addMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<AddOrganizationMemberMutation, AddOrganizationMemberMutationVariables>;
export const ChangeOrganizationMemberRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ChangeOrganizationMemberRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationMemberRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"changeMemberRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ChangeOrganizationMemberRoleMutation, ChangeOrganizationMemberRoleMutationVariables>;
export const RemoveOrganizationMemberDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveOrganizationMember"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OrganizationMemberInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeMember"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<RemoveOrganizationMemberMutation, RemoveOrganizationMemberMutationVariables>;
export const UpdateOrganizationFinancialProfileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOrganizationFinancialProfile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateOrganizationFinancialProfileInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"organizations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFinancialProfile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateOrganizationFinancialProfileMutation, UpdateOrganizationFinancialProfileMutationVariables>;
export const UserPreviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserPreview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeRoles"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UserSummaryFields"}},{"kind":"Field","name":{"kind":"Name","value":"roles"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeRoles"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"localizedName"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserSummaryFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"info"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"surname"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]} as unknown as DocumentNode<UserPreviewQuery, UserPreviewQueryVariables>;
export const ProductRecommendedPriceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductRecommendedPrice"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"RecommendedPriceInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"recommendedPrice"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"missingQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"unitPrice"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProductRecommendedPriceQuery, ProductRecommendedPriceQueryVariables>;
export const MarkupGroupsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MarkupGroups"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchMarkupGroupsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markupGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MarkupGroupFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MarkupGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarkupGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceMessageId"}}]}}]} as unknown as DocumentNode<MarkupGroupsQuery, MarkupGroupsQueryVariables>;
export const MarkupGroupRangesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MarkupGroupRanges"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PaginationInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markupGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"ranges"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"pagination"},"value":{"kind":"Variable","name":{"kind":"Name","value":"pagination"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MarkupRangeFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MarkupRangeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarkupRange"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rangeStart"}},{"kind":"Field","name":{"kind":"Name","value":"rangeEnd"}},{"kind":"Field","name":{"kind":"Name","value":"markup"}}]}}]} as unknown as DocumentNode<MarkupGroupRangesQuery, MarkupGroupRangesQueryVariables>;
export const MarkupGroupUpsertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkupGroupUpsert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertMarkupGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markupGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"MarkupGroupFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"MarkupGroupFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"MarkupGroup"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sourceMessageId"}}]}}]} as unknown as DocumentNode<MarkupGroupUpsertMutation, MarkupGroupUpsertMutationVariables>;
export const MarkupGroupDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkupGroupDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markupGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<MarkupGroupDeleteMutation, MarkupGroupDeleteMutationVariables>;
export const PriceAppliersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PriceAppliers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"usage"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PriceOfferSourceType"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"priceAppliers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"list"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"usage"},"value":{"kind":"Variable","name":{"kind":"Name","value":"usage"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PriceApplierFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PriceApplierFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PriceApplier"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isDynamic"}},{"kind":"Field","name":{"kind":"Name","value":"dslLogic"}},{"kind":"Field","name":{"kind":"Name","value":"states"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"priceApplierSystemName"}},{"kind":"Field","name":{"kind":"Name","value":"usage"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<PriceAppliersQuery, PriceAppliersQueryVariables>;
export const PriceApplierUpsertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PriceApplierUpsert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertPriceApplierInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"priceAppliers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PriceApplierFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PriceApplierFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PriceApplier"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"isDynamic"}},{"kind":"Field","name":{"kind":"Name","value":"dslLogic"}},{"kind":"Field","name":{"kind":"Name","value":"states"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"priceApplierSystemName"}},{"kind":"Field","name":{"kind":"Name","value":"usage"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}}]}}]}}]} as unknown as DocumentNode<PriceApplierUpsertMutation, PriceApplierUpsertMutationVariables>;
export const PriceApplierDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"PriceApplierDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"priceAppliers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"systemName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"systemName"}}}]}]}}]}}]} as unknown as DocumentNode<PriceApplierDeleteMutation, PriceApplierDeleteMutationVariables>;
export const ProductPriceOffersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductPriceOffers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductOffersInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"offers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"score"}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sellPrice"}},{"kind":"Field","name":{"kind":"Name","value":"markup"}},{"kind":"Field","name":{"kind":"Name","value":"forStorage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"deliveryDays"}},{"kind":"Field","name":{"kind":"Name","value":"guaranteedDeliveryDays"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryProbability"}},{"kind":"Field","name":{"kind":"Name","value":"offer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"offerForStorage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"Field","name":{"kind":"Name","value":"purchasePrice"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"availableQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"minimumPurchaseQuantity"}},{"kind":"Field","name":{"kind":"Name","value":"quantityCoefficient"}},{"kind":"Field","name":{"kind":"Name","value":"daysToRefund"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryDate"}},{"kind":"Field","name":{"kind":"Name","value":"guaranteedDeliveryDate"}},{"kind":"Field","name":{"kind":"Name","value":"deliveryProbability"}},{"kind":"Field","name":{"kind":"Name","value":"orderTill"}},{"kind":"Field","name":{"kind":"Name","value":"expiresAt"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<ProductPriceOffersQuery, ProductPriceOffersQueryVariables>;
export const SchemaProductsByIdsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SchemaProductsByIds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byIds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<SchemaProductsByIdsQuery, SchemaProductsByIdsQueryVariables>;
export const ProductByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"crossesInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductCrossesInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeCrosses"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeCatalogueCandidate"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"includeEans"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductDetailsFields"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"catalogueCandidates"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeCatalogueCandidate"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byProductId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"productId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupplierProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupplierProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"candidateId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"names"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplierProductId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"eans"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeEans"}}}]}]},{"kind":"Field","name":{"kind":"Name","value":"characteristics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"characteristic"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedName"}}]}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pair"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductListFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductListFields"}},{"kind":"Field","name":{"kind":"Name","value":"images"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"crosses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"crossesInput"}}}],"directives":[{"kind":"Directive","name":{"kind":"Name","value":"include"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"if"},"value":{"kind":"Variable","name":{"kind":"Name","value":"includeCrosses"}}}]}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductListFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}}]} as unknown as DocumentNode<ProductByIdQuery, ProductByIdQueryVariables>;
export const CatalogueSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CatalogueSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueSearchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"highlights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"fragments"}}]}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"catalogues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateSearchFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"highlights"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"field"}},{"kind":"Field","name":{"kind":"Name","value":"fragments"}}]}}]}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateSearchFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"names"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<CatalogueSearchQuery, CatalogueSearchQueryVariables>;
export const ProducerSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProducerSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProducerSearchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<ProducerSearchQuery, ProducerSearchQueryVariables>;
export const ProductGroupsSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductGroupsSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchProductGroupsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedName"}}]}}]}}]}}]} as unknown as DocumentNode<ProductGroupsSearchQuery, ProductGroupsSearchQueryVariables>;
export const ProductGroupsByIdsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductGroupsByIds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byIds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedName"}}]}}]}}]}}]} as unknown as DocumentNode<ProductGroupsByIdsQuery, ProductGroupsByIdsQueryVariables>;
export const CharacteristicsSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CharacteristicsSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SearchCharacteristicsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"characteristics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedName"}}]}}]}}]}}]} as unknown as DocumentNode<CharacteristicsSearchQuery, CharacteristicsSearchQueryVariables>;
export const CharacteristicsByIdsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CharacteristicsByIds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"characteristics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byIds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedName"}}]}}]}}]}}]} as unknown as DocumentNode<CharacteristicsByIdsQuery, CharacteristicsByIdsQueryVariables>;
export const CharacteristicUpsertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CharacteristicUpsert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertCharacteristicInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"characteristics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedName"}}]}}]}}]}}]} as unknown as DocumentNode<CharacteristicUpsertMutation, CharacteristicUpsertMutationVariables>;
export const CharacteristicDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CharacteristicDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"characteristics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]}}]} as unknown as DocumentNode<CharacteristicDeleteMutation, CharacteristicDeleteMutationVariables>;
export const ProductGroupUpsertDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProductGroupUpsert"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpsertProductGroupInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productGroups"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upsert"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"normalizedName"}}]}}]}}]}}]} as unknown as DocumentNode<ProductGroupUpsertMutation, ProductGroupUpsertMutationVariables>;
export const ProductPatchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProductPatch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"PatchProductInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"patch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"productId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productId"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ProductPatchMutation, ProductPatchMutationVariables>;
export const ProductDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProductDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeleteProductInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<ProductDeleteMutation, ProductDeleteMutationVariables>;
export const ProductCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProductCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"products"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateProductInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"products"},"value":{"kind":"Variable","name":{"kind":"Name","value":"products"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]} as unknown as DocumentNode<ProductCreateMutation, ProductCreateMutationVariables>;
export const ProductEanCreateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProductEanCreate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductEanInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productEans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"create"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<ProductEanCreateMutation, ProductEanCreateMutationVariables>;
export const ProductEanDeleteDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProductEanDelete"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductEanInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"productEans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"delete"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]} as unknown as DocumentNode<ProductEanDeleteMutation, ProductEanDeleteMutationVariables>;
export const ProducersByIdsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProducersByIds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"producers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byIds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<ProducersByIdsQuery, ProducersByIdsQueryVariables>;
export const CatalogueCandidatesForReviewDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CatalogueCandidatesForReview"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueSearchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogue"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogues"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"items"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"item"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"}}]}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupplierProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupplierProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"candidateId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"names"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplierProductId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}}]} as unknown as DocumentNode<CatalogueCandidatesForReviewQuery, CatalogueCandidatesForReviewQueryVariables>;
export const CatalogueCandidateByIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CatalogueCandidateById"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UUID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogueCandidates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateDetailsFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupplierProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupplierProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"candidateId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"names"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplierProductId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateCrossFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"}},{"kind":"Field","name":{"kind":"Name","value":"crosses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapped"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateCrossFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"notMapped"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}}]}}]} as unknown as DocumentNode<CatalogueCandidateByIdQuery, CatalogueCandidateByIdQueryVariables>;
export const CatalogueCandidateByProductIdDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"CatalogueCandidateByProductId"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"productId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogueCandidates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byProductId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"productId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"productId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateDetailsFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupplierProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupplierProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"candidateId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"names"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplierProductId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateCrossFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"}},{"kind":"Field","name":{"kind":"Name","value":"crosses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapped"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateCrossFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"notMapped"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}}]}}]} as unknown as DocumentNode<CatalogueCandidateByProductIdQuery, CatalogueCandidateByProductIdQueryVariables>;
export const CandidateToCatalogueDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CandidateToCatalogue"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CandidateToCatalogueInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogueCandidates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"candidateToCatalogue"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CandidateToCatalogueMutation, CandidateToCatalogueMutationVariables>;
export const MapCandidateCrossesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MapCandidateCrosses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"MaxCandidateCrossesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"catalogueCandidates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapCrosses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateDetailsFields"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"images"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"aliases"}}]}},{"kind":"Field","name":{"kind":"Name","value":"group"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"size"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"length"}},{"kind":"Field","name":{"kind":"Name","value":"width"}},{"kind":"Field","name":{"kind":"Name","value":"height"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"volumeM3"}}]}},{"kind":"Field","name":{"kind":"Name","value":"weight"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"weight"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SupplierProductFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SupplierProduct"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"candidateId"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"names"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"supplierProductId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateCrossFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"supplierProducts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CatalogueCandidateDetailsFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CatalogueCandidate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateReviewFields"}},{"kind":"Field","name":{"kind":"Name","value":"crosses"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"mapped"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CatalogueCandidateCrossFields"}}]}},{"kind":"Field","name":{"kind":"Name","value":"notMapped"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SupplierProductFields"}}]}}]}}]}}]} as unknown as DocumentNode<MapCandidateCrossesMutation, MapCandidateCrossesMutationVariables>;
export const ProductAvailableStockDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductAvailableStock"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductAvailableStocksInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"availableStock"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<ProductAvailableStockQuery, ProductAvailableStockQueryVariables>;
export const ProductsAvailableStockDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductsAvailableStock"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductAvailableStocksInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byIds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"availableStock"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]}}]}}]} as unknown as DocumentNode<ProductsAvailableStockQuery, ProductsAvailableStockQueryVariables>;
export const ProductPairDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductPair"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"pair"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductListFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ProductPairQuery, ProductPairQueryVariables>;
export const ProductContentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductContents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"contents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"quantity"}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductListFields"}},{"kind":"Field","name":{"kind":"Name","value":"images"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ProductContentsQuery, ProductContentsQueryVariables>;
export const ResolveProductReferencesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ResolveProductReferences"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"references"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductReferenceInput"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"resolve"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"references"},"value":{"kind":"Variable","name":{"kind":"Name","value":"references"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"producerName"}},{"kind":"Field","name":{"kind":"Name","value":"supplier"}},{"kind":"Field","name":{"kind":"Name","value":"productId"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ResolveProductReferencesQuery, ResolveProductReferencesQueryVariables>;
export const ProductCrossesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductCrosses"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductCrossesInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"crosses"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductListFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ProductCrossesQuery, ProductCrossesQueryVariables>;
export const ProductStorageContentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ProductStorageContents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProductStorageContentsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"products"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"byId"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"storageContents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"buyPrice"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"sign"}}]}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductListFields"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<ProductStorageContentsQuery, ProductStorageContentsQueryVariables>;
export const StorageContentsSearchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"StorageContentsSearch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"StorageContentsSearchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"storageContents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"search"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"rowVersion"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"buyPrice"}},{"kind":"Field","name":{"kind":"Name","value":"purchaseDatetime"}},{"kind":"Field","name":{"kind":"Name","value":"currency"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"shortName"}},{"kind":"Field","name":{"kind":"Name","value":"sign"}}]}},{"kind":"Field","name":{"kind":"Name","value":"storage"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"type"}}]}},{"kind":"Field","name":{"kind":"Name","value":"product"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"ProductListFields"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ProductListFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Product"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"sku"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"indicator"}},{"kind":"Field","name":{"kind":"Name","value":"stock"}},{"kind":"Field","name":{"kind":"Name","value":"producer"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}}]}}]} as unknown as DocumentNode<StorageContentsSearchQuery, StorageContentsSearchQueryVariables>;