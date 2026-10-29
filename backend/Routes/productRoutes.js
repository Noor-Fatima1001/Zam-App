const express = require('express');
const {
    createProductCategory, updateProductCategory, getProductCategoryList,
    createProduct, updateProduct, getProductList,
    creatProductToDept, updateProductToDept, getProductTODeptList, getProductUnits,
    getUserProductList, createStockOverview, updateStockOverview, getStockOverview,
    createOrder, getUserOrderList, getUserOrderListEnteries, orderEntryDelete,
    createItemLedger, getItemLedgerHead, getItemLedgerEnteries, itemLedgerEntryDelete, getOpenItemForDelivery,itemPurchaseActivity,

    createRecipe,getProductChildItems, getDeptRecipeList, getRecipeDetails, productInBatchRecipe, getDeptProductForRecipeCreation,
    productChildDelete, createInventoryAdjustment, inventoryAdjustmentDelete, InventoryAdjustmentDetailDelete, itemAdjustmentHead,
    itemAdjustmentDetails, getSalesPlu, salesPluUpdate, creatLocation, updateLocation, getLocationList,
    assignLocationToDept, updateAssignLocationToDept, getAssignLocationToDept, createStockList,
    adminClosingStockHeader, adminClosingStockEnteries, deptClosingStockHeader, deptClosingStockEnteries,saveClosingStock,
    lockForVariance, unlockForVariance, itemCostMovment

    

} = require('../controller/product/productController.js');
const router = express.Router();
const { authenticateToken } = require('../utils/JWTAuthenticate.js'); // Use destructuring here

router.post('/createProductCategory', authenticateToken, createProductCategory);
router.post('/updateProductCategory', authenticateToken, updateProductCategory);
router.post('/getProductCategoryList', authenticateToken, getProductCategoryList);

router.post('/createProduct', authenticateToken, createProduct);
router.post('/updateProduct', authenticateToken, updateProduct);
router.post('/getProductList', authenticateToken, getProductList);

router.post('/creatProductToDept', authenticateToken, creatProductToDept);
router.post('/updateProductToDept', authenticateToken, updateProductToDept);
router.post('/getProductTODeptList', authenticateToken, getProductTODeptList);
router.post('/getProductUnits', authenticateToken, getProductUnits);
router.post('/getUserProductList', authenticateToken, getUserProductList);


router.post('/createStockOverview', authenticateToken, createStockOverview);
router.post('/updateStockOverview', authenticateToken, updateStockOverview);
router.post('/getStockOverview', authenticateToken, getStockOverview);

router.post('/createOrder', authenticateToken, createOrder);
router.post('/getUserOrderList', authenticateToken, getUserOrderList);
router.post('/getUserOrderListEnteries', authenticateToken, getUserOrderListEnteries);
router.post('/orderEntryDelete', authenticateToken, orderEntryDelete);

router.post('/createItemLedger', authenticateToken, createItemLedger);
router.post('/getItemLedgerHead', authenticateToken, getItemLedgerHead);
router.post('/getItemLedgerEnteries', authenticateToken, getItemLedgerEnteries);
router.post('/itemLedgerEntryDelete', authenticateToken, itemLedgerEntryDelete);

router.post('/getOpenItemForDelivery', authenticateToken, getOpenItemForDelivery);
router.post('/itemPurchaseActivity', authenticateToken, itemPurchaseActivity);

router.post('/createRecipe', authenticateToken, createRecipe);
router.post('/getProductChildItems', authenticateToken, getProductChildItems);
router.post('/getDeptRecipeList', authenticateToken, getDeptRecipeList);
router.post('/getRecipeDetails', authenticateToken, getRecipeDetails);
router.post('/productInBatchRecipe', authenticateToken, productInBatchRecipe);
router.post('/getDeptProductForRecipeCreation', authenticateToken, getDeptProductForRecipeCreation);
router.post('/productChildDelete', authenticateToken, productChildDelete);

router.post('/createInventoryAdjustment', authenticateToken, createInventoryAdjustment);
router.post('/inventoryAdjustmentDelete', authenticateToken, inventoryAdjustmentDelete);
router.post('/InventoryAdjustmentDetailDelete', authenticateToken, InventoryAdjustmentDetailDelete);
router.post('/itemAdjustmentHead', authenticateToken, itemAdjustmentHead);
router.post('/itemAdjustmentDetails', authenticateToken, itemAdjustmentDetails);

router.post('/getSalesPlu', authenticateToken, getSalesPlu);
router.post('/salesPluUpdate', authenticateToken, salesPluUpdate);


router.post('/creatLocation', authenticateToken, creatLocation);
router.post('/updateLocation', authenticateToken, updateLocation);
router.post('/getLocationList', authenticateToken, getLocationList);
router.post('/assignLocationToDept', authenticateToken, assignLocationToDept);
router.post('/updateAssignLocationToDept', authenticateToken, updateAssignLocationToDept);
router.post('/getAssignLocationToDept', authenticateToken, getAssignLocationToDept);

router.post('/createStockList', authenticateToken, createStockList);
router.post('/adminClosingStockHeader', authenticateToken, adminClosingStockHeader);
router.post('/adminClosingStockEnteries', authenticateToken, adminClosingStockEnteries);
router.post('/deptClosingStockHeader', authenticateToken, deptClosingStockHeader);
router.post('/deptClosingStockEnteries', authenticateToken, deptClosingStockEnteries);
router.post('/saveClosingStock', authenticateToken, saveClosingStock);
router.post('/lockForVariance', authenticateToken, lockForVariance);
router.post('/unlockForVariance', authenticateToken, unlockForVariance);
router.post('/itemCostMovment', authenticateToken, itemCostMovment);











module.exports = router;