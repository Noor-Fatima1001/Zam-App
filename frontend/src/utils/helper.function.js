import Cookies from "js-cookie";
export const formatNumber = (number) => {
  if (!number) return "";

  const formattedNumber = parseFloat(number).toFixed(3);

  // Add commas for UK number format (including decimal places)
  return formattedNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const unformatNumber = (formattedNumber) => {
  if (!formattedNumber) {
    console.warn("Invalid value provided to unformatNumber:", formattedNumber);
    return "";
  }
  return formattedNumber.toString().replace(/,/g, "");
};

export const setCookie = (key, value) => {
  try {
    if (!key || value === undefined) {
      throw new Error("Key and value are required.");
    }
    const jsonValue = JSON.stringify(value);
    Cookies.set(key, jsonValue);
    console.log(`Cookie stored`);
  } catch (error) {
    console.error("Error :", error);
  }
};

export const getCookie = (key) => {
  try {
    if (!key) {
      throw new Error("Key is required.");
    }
    const value = Cookies.get(key);
    if (value === undefined) {
      console.warn(`No cookie found `);
      return null;
    }
    return JSON.parse(value);
  } catch (error) {
    console.error("Error :", error);
    return null;
  }
};
export const removeCookie = (key) => {
  try {
    if (!key) {
      throw new Error("Key is required .");
    }
    Cookies.remove(key);
    console.log(`Cookie removed `);
  } catch (error) {
    console.error("Error :", error);
  }
};
// == month number
export function getMonthNumber(monthName) {
  const months = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };

  const normalizedMonthName = monthName?.toLowerCase();

  return months[normalizedMonthName] || null;
}

export const formatNumberDisplay = (value) => {
  const numberValue = Number(value);
  const formattedNumber = numberValue.toFixed(3);
  const [integerPart, decimalPart] = formattedNumber.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalPart
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;
};
export const formatPrintNumberDisplay = (value) => {
  const numberValue = Number(value);
  const formattedNumber = numberValue.toFixed(2);
  const [integerPart, decimalPart] = formattedNumber.split('.');
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return decimalPart
    ? `${formattedInteger}.${decimalPart}`
    : formattedInteger;
};
export const formatUnderScoreValue = (value) => {
  return value
    ?.split('_')
    ?.map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() // Capitalize each word
    )
    ?.join(' ');
};

export const formatDecimalValue = (value) => {
  const num = Number(value);
  if (isNaN(num)) return 0; 
  return parseFloat(num.toFixed(3));
};




// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
/**
 * ⚠️ WARNING: Critical internal function.
 * DO NOT MODIFY without consulting Awais.
 * Used in many places. Misuse can cause [consequences].
*/
export const filterAndSortData = (
  data,
  apiData,
  setRowsData,
  presfilters,
  preservedConfig,
  setPresFilters,
  setPreservedConfig,
  filters,
  sortConfig,
  preservedFilter,
  newsortConfig
) => {
  /**
   * ⚠️ WARNING: Critical internal function.
   * DO NOT MODIFY without consulting Awais.
   * Used in many places. Misuse can cause [consequences].
  */
  let newData = apiData
    .map((item) => ({ ...item }))
    .filter((item) => {
      if (Object.keys(filters || {}).length === 0 || Object.values(filters || {}).every(val => val === "")) {
        setRowsData(apiData);
        return apiData;
      }
      /**
       * ⚠️ WARNING: Critical internal function.
       * DO NOT MODIFY without consulting Awais.
       * Used in many places. Misuse can cause [consequences].
      */
      const allItemValuesEmpty = Object.keys(filters || {}).every((key) => {
        if (!filters[key]) return true;
        const value = item[key]?.toString()?.toLowerCase() || "";
        return value === "";
      });

      if (allItemValuesEmpty) {
        return true;
      }

      /**
       * ⚠️ WARNING: Critical internal function.
       * DO NOT MODIFY without consulting Awais.
       * Used in many places. Misuse can cause [consequences].
      */
      return Object?.keys(filters || {})?.every((key) => {
        if (!filters[key]) return true;
        const value = item[key]?.toString()?.toLowerCase() || "";
        const filterValue = filters[key]?.toLowerCase();
        return value?.includes(filterValue);
      });
    });
  /**
  * ⚠️ WARNING: Critical internal function.
  * DO NOT MODIFY without consulting Awais.
  * Used in many places. Misuse can cause [consequences].
  */
  if (sortConfig && sortConfig?.key && preservedConfig !== newsortConfig) {
    setPreservedConfig(newsortConfig);
    const emptyItems = newData?.filter(
      (item) => !item[sortConfig?.key] && item[sortConfig?.key] !== 0
    );
    const nonEmptyItems = newData.filter(
      (item) => item[sortConfig?.key] || item[sortConfig?.key] === 0
    );
    nonEmptyItems.sort((a, b) => {
      const valueA = a[sortConfig?.key] ?? "";
      const valueB = b[sortConfig?.key] ?? "";
      const strA = valueA.toString()?.toLowerCase();
      const strB = valueB.toString()?.toLowerCase();
      if (strA < strB) return sortConfig?.direction === "asc" ? -1 : 1;
      if (strA > strB) return sortConfig?.direction === "asc" ? 1 : -1;
      return 0;
    });
    newData =
      sortConfig?.direction === "asc"
        ? [...nonEmptyItems, ...emptyItems]
        : [...emptyItems, ...nonEmptyItems];
  }
  /**
   * ⚠️ WARNING: Critical internal function.
   * DO NOT MODIFY without consulting Awais.
   * Used in many places. Misuse can cause [consequences].
  */
  if (preservedConfig === newsortConfig && preservedFilter === presfilters) {
    setPreservedConfig(newsortConfig);
    setRowsData(data);
    return data;
  } else {
    setPreservedConfig(newsortConfig);
    setPresFilters(preservedFilter);
    const mappedData = newData?.map((item) => ({
      ...item,
    }));
    setRowsData(mappedData);
    return mappedData;
  }
  /**
   * ⚠️ WARNING: Critical internal function.
   * DO NOT MODIFY without consulting Awais.
   * Used in many places. Misuse can cause [consequences].
  */
};
