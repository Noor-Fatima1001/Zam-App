const useGoBackToParent = () => {
  const goBackToParent = () => {
    window.opener?.focus();
    window.close();
  };

  return goBackToParent;
};

export default useGoBackToParent;
