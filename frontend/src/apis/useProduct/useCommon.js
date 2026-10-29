import { useMutation } from "@tanstack/react-query";
import { globelApi } from "../client/product/common";

export function useGlobelApi(endpoint, token) {
  return useMutation({
    mutationFn: (body) => globelApi.dataPost(body, endpoint, token),
  });
}
export function useGlobelApiFormDara(endpoint) {
  return useMutation({
    mutationFn: (body) => globelApi.dataPostFormData(body, endpoint),
  });
}
