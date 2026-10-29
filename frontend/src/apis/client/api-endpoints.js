export const API_ENDPOINTS = {
  LOGIN:"/login",
  CREATE_USER:"/createUser",
  USERS: "/getUserFilters",
  UPDTE_USER: "/updateUser",
  SINGLE_USER: "/getSingleUser",
  USER_TO_COMPANY: "/getUserToCompany",
  CREATE_COMPANY: "/createCompany",
  USER_TO_DEPARTMENT: "/getUserToDept",
  COM_TO_DEPARTMENT: "/getCompanyToDept",

  CREATE_DEPARTMENT: "/createDepartment",
  GET_DEPARTMENT: "/getAllDepartment",
  UPDATE_DEPARTMENT: "/updateDepartment",
  ASSIGN_DEPARTMENT_TO_COMPANY: "/assignDeptToCom",
  ASSIGN_USER_TO_DEPARTMENT: "/assignDeptToUsers",
  USER_USER_TO_DEPARTMENT: "/updateUserToDept",
  CREATE_MODULE: "/createModule",
  GET_MODULE: "/getAllModules",
  UPDATE_MODULE: "/updateModule",
  CREATE_SUBMODULE: "/createSubModule",
  GET_SUBMODULE: "/getSubModuleList",
  SUB_SUBMODULE: "/updateSubModule",
  GET_COMPANY: "/getAllCompany",
  UPDATE_COMPANY: "/updateCompany",
  ASSIGN_USER_TO_COMPANY: "/assignUserToCompany",
  UPDATE_USER_TO_COMPANY: "/updateUserToCompany",
  UPDATE_DEPT_TO_COMPANY: "/updateDeptToCom",
  ACCESS_USER_MODULE: "/accessUserModules",
  UPDATE_ACCESS_USER_MODULE: "/updateUserModule",
  SIDEBAR: "/sidebar",

  // Inter Company Gl Setup
  GET_INTER_COMPANY_GL: "/getInterCompanyGl",
  ASSIGN_INTER_COMPANY_GL: "/assignInterCompnayGl",
  UPDATE_INTER_COMPANY_GL: "/updateInterCompnayGl",

  // INTER COMPANY JV
  GET_INTER_COMP_JV_HEAD:"/getInterCompanyJvHead",
  GET_INTER_COMP_JV_ENTRIES:"/getInterCompanyJvEnteries",
  CREATE_INTER_COMP_JV:"/createInterCompanyJv",

  // Coa
  Add_COA: "/createCoa",
  UPDATE_COA: "/updateCoa",
  GET_COA: "/getCoa",
  // sub head
  Add_MAIN_HEAD: "/createCoaMainHead",
  UPDATE_MAIN_HEAD: "/updateCoaMainHead",
  GET_MAIN_HEAD: "/getCoaMainHead",
  // Coa
  Add_SUB_HEAD: "/createCoaSubHead",
  UPDATE_SUB_HEAD: "/updateCoaSubHead",
  GET_SUB_HEAD: "/getCoaSubHead",
  // jernul-voucher
  Add_JE_VOUCHER: "/createJeVoucher",
  GET_JE_VOUCHER: "/getJeVouchers",
  GET_JE_VOUCHER_HEADER: "/getJeHeaderList",
  GET_JE_VOUCHER_ENTRIES: "/getJeEntriesList",
  GET_JE_VOUCHER_REVERSAL: "/reversalJeVoucher",
  UPLOAD_JE_EXCEL:"uploadExcelJvs",
  // FiscalYear
  Add_FISCAL_YEAR: "/createFiscalYear",
  CLOSE_FISCAL_YEAR: "/closingOfFiscalYears",
  GET_FISCAL_YEAR: "/getFiscalYears",
  // FiscalYear month
  CLOSE_FISCAL_YEAR_MONTH: "/closingOfFiscalYearMonth",
  GET_FISCAL_YEAR_MONTH: "/getFiscalYearsMonths",
  // tax
  ADD_TAX: "/createTax",
  TAX_LIST: "/getTaxList",
  UPDATE_TAX: "/updateTax",
  // Suppliers
  ADD_SUPPLIER: "/createSupplier",
  GET_SUPPLIER: "/getSuppliersList",
  UPDATE_SUPPLIER: "/updateSupplier",
  ASSIGN_TAX_SUPPLIER: "/assignTaxToSupplier",
  UPDATE_TAX_SUPPLIER: "/updateTaxToSupplier",
  GET_TAX_SUPPLIER: "/getAssignedTaxToSupplierList",
  SUPPLIER_INVOICE_DELETE: "/supInvDelete",
  // Supplier Invoice
  ADD_SUPPLIER_INVOICE: "/createInvoice",
  GET_SUPPLIER_INVOICE_HEADER: "/getInvoiceHeaderList",
  GET_SUPPLIER_INVOICE_ENTERIES: "/getInvoiceEnteriesList",
  SUPPLIER_REVERSAL: "/invoiceReversal",
  DELETE_SUPPLIER_INVOICE_ENTRY: "/supInvEntryDelete",
  UPLOAD_SUPPLIER_EXCEL: "/uploadExcelInvoices",
  // Report Module
  GET_TRAIL_BALANCE: "/getTrialBalance",
  GET_JOURNAL_LEDGER: "/getJournalLedger",
  GET_BALANCE_SHEET:"/getBalanceSheet",
  GET_SUPPLIER_LEDGER:"/getSupplierLedger",
  GET_VARIANCE_REPORT:"/getVarianceReport",
  GET_ITEM_ACTIVITY:"/getItemActivity",
  GET_COST_SUMMARY:"/getCostSummary",
  // Periods
  GET_INVENTORY_PERIOD:"/getInventoryPeriodList",


  // uni master
  ADD_UNIT_MASTER: "/createUnitMaster",
  GET_UNIT_MASTER: "/getUnitMaster",
  UPDATE_UNIT_MASTET: "updateUnitMaster",

  //Unit List
  GET_UNIT_LIST: "/getUnitList",


  ADD_UNIT_LIST: "/createUnitList",
  UPDATE_UNIT_LIS: "/updateUnitList",

  //Categort List
  GET_CATEGORY_LIST: "/getproductCategoryList",
  ADD_CATERGORY_LIST: "/createProductCategory",
  UPDATE_CATEGORY_LIST: "/updateProductCategory",

  //Payment 
  GET_UNPAIDINVOICE_LIST: "/getUnpaidInvoices",
  //Product List
  GET_PRODUCT_LIST: "/getProductList",
  ADD_PRODUCT_LIST: "/createProduct",
  UPDATE_PRODUCT_LIST: "/updateProduct",
  GET_PRODUCT_UNITS: "/getProductList",
  GET_USER_PRODUCT_LIST: "/getUserProductList",
  GET_PRODUCT_UNITS: "/getProductUnits",
  //Product To Dept
  GET_PRODUCT_TO_DEPT_LIST: "/getProductTODeptList",
  ADD_PRODUCT_TO_DEPT_LIST: "/creatProductToDept",
  UPDATE_PRODUCT_TO_DEPT_LIST: "/updateProductToDept",
  ITEM_PURCHASE_ACTIVITY:"/itemPurchaseActivity",
  ITEM_COST_MOVEMENT:"/itemCostMovment",
  PRODUCT_IN_BATCH_RECIPE:"/productInBatchRecipe",
  GET_PRODUCT_FOR_RECIPE_CREATION:"/getDeptProductForRecipeCreation",

  // Recipe
  CREATE_RECIPE:"/createRecipe",

  DELETE_RECIPE_CHILD_ITEM:"/productChildDelete",
  GET_DEPT_RECIPE_LIST:"/getDeptRecipeList",
  GET_RECIPE_ENTRIES:"/getProductChildItems",
  GET_RECIPE_DETAILS:"/getRecipeDetails",
  

  //Conversions List
  GET_CONVERSIONS_LIST: "/getConversionList",
  ADD_CONVERSIONS_LIST: "/createConversion",
  UPDATE_CONVERSIONS_LIST: "/updateConversion",
  GET_CONVERSION_QTY_PRICE: "/getConverisonQtyPrice",

  // Stocks Overview
  GET_STOCK: "/getStockOverview",
  ADD_STOCK: "/createStockOverview",
  UPDATE_STOCK: "/updateStockOverview",


  //GET_USERS_TO_DEPT

  GET_USERS_TO_DEPT: "/getUserToDept",
  // Purchase Order List
  GET_PURCHASE_ORDER_LIST: "/getUserOrderList",
  ADD_PURCHASE_ORDER: "/createOrder",
  GET_PURCHASE_ORDER_LIST_ENTRIES: "/getUserOrderListEnteries",
  DELETE_OREDER_LIST_ENTRY: "orderEntryDelete",

  // Item Ledger
  CREATE_ITEM_LEDGER: "/createItemLedger",
  GET_ITEM_LEDGER_ENTRIES: "/getItemLedgerEnteries",
  GET_ITEM_LEDGER_HEAD: "/getItemLedgerHead",
  DELETE_ITEM_LEDGER_ENTRY: "/itemLedgerEntryDelete",
  GET_OPEN_ITEM_FOR_DELIVERY: "/getOpenItemForDelivery",
  UPLOAD_EXCEL_ITEM_LEDGER:"/uploadExcelItemLedger", 
  // Inventory Adjustments
  CREATE_INVENTORY_ADJUSTMENT:"/createInventoryAdjustment",
  DELETE_INVENTORY_ADJUSTMENT_DETAIL:"/InventoryAdjustmentDetailDelete",
  INVENTORY_ADJUSTMENT_HEAD:"/itemAdjustmentHead",
  INVENTORY_ADJUSTMENT_ENTRIES:"/itemAdjustmentDetails",

  // Dept_ProductListing 
  GET_USERS_TO_DEPT: "/getUserToDept",

  // love pos
  GET_MASTER_ITEMS: "/masterdata_items",
  GET_MASTER_PAYMENTS: "/masterdata_payments",
  GET_SALE_ITEMS: "/getSalesData",
  // dailySales 
  DAILY_SALES: "/dailySales",
  POST_DAILY_SALES: "/postSalesData",
  GET_PLU_SALES: "/getSalesPlu",
  PLU_SALES_UPDATE: "/salesPluUpdate",

  //  Bank List//
  GET_BANK_LIST: "/getBankList",
  ADD_BANK_LIST: "/createBank",
  UPDATE_BANK_LIST: "/updateBank",

  // Assign Bank List//
  ASSIGN_BANK_LIST: "/getAssignedBankToCompany",
  ASSIGN_BANK: "/assignBankToCompany",
  UPDATE_ASSIGN_BANK: "/updateBankToCompany",
  
  // Location List
  ASSIGN_LOCATION_LIST: "/getAssignLocationToDept",
  ASSIGN_LOCATION_TO_DEPT: "/assignLocationToDept",
  UPDATE_ASSIGN_LOCATION: "/updateAssignLocationToDept",
  
  // Payments 
  PAYMENT_HEAD_LIST:"/paymentHeadList",
  PAYMENT_ENTRIES:"/paymentEnteries",
  PAYMENT_ENTRIES_GL:"/paymentEnteriesDirectGl",
  CREATE_PAYMENT:"/createPayment",
  GET_UNPAID_INVOICES:"/getUnpaidInvoices",
  PAYMENT_REVERSAL:"/paymentReversal",


  //  Stock Location
  GET_LOCATION_LIST: "/getLocationList",
  ADD_STOCK_LOCATION: "/creatLocation",
  UPDATE_STOCK_LOCATION: "/updateLocation",

  // Closing Stock
  CREATE_STOCK_LIST:"/createStockList",
  CLOSING_STOCK_HEADER:"/adminClosingStockHeader",
  DEPT_CLOSING_STOCK_HEADER:"/deptClosingStockHeader",
  CLOSING_STOCK_ENTRIES:"/adminClosingStockEnteries",
  DEPT_CLOSING_STOCK_ENTRIES:"/deptClosingStockEnteries",
  SAVE_CLOSING_STOCK:"/saveClosingStock",
  LOCK_FOR_VARIANCE:"/lockForVariance",
  UNLOCK_FOR_VARIANCE:"/unlockForVariance",
  POST_VARIANCE:"/postVariance",

};
