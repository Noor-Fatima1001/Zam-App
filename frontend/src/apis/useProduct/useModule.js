import { useMutation } from "@tanstack/react-query";
import { module } from "../client/product/module";
export function useAddModule() {
  return useMutation({
    mutationFn: (body) => module.AddModule(body),
  });
}
export function useUpdateModule() {
  return useMutation({
    mutationFn: (body) => module.UpdateModule(body),
  });
}
export function useGetModule() {
  return useMutation({
    mutationFn: (body) => module.GetModule(body),
  });
}
