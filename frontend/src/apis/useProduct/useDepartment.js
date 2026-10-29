import { useMutation } from "@tanstack/react-query";
import { department } from "../client/product/department";
export function useAddDepartment() {
  return useMutation({
    mutationFn: (body) => department.AddDepartment(body),
  });
}
export function useUpdateDepartment() {
  return useMutation({
    mutationFn: (body) => department.UpdateDepartment(body),
  });
}
export function useGetDepartment() {
  return useMutation({
    mutationFn: (body) => department.GetDepartment(body),
  });
}
export function useGetCom_Department() {
  return useMutation({
    mutationFn: (body) => department.GetCom_Department(body),
  });
}
