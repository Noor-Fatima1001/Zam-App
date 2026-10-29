import { useMutation } from "@tanstack/react-query";
import { module } from "../client/product/module";
import { subModule } from "../client/product/subModule";
export function useAddSubModule() {
  return useMutation({
    mutationFn: (body) => subModule.AddSubModule(body),
  });
}
export function useUpdateSubModule() {
  return useMutation({
    mutationFn: (body) => subModule.UpdateSubModule(body),
  });
}
export function useGetSubModule() {
  return useMutation({
    mutationFn: (body) => subModule.GetSubModule(body),
  });
}
