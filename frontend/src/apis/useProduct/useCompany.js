import { useMutation } from "@tanstack/react-query";
import { company } from "../client/product/company";

export function useGetCompany() {
  return useMutation({
    mutationFn: (body) => company.GetCompany(body),
  });
}
export function useUpdateCompany() {
  return useMutation({
    mutationFn: (body) => company.UpdateCompany(body),
  });
}
