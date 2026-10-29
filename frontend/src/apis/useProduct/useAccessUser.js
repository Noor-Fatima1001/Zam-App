import { useMutation } from "@tanstack/react-query";
import { userAcces } from "../client/product/UserAccess";

export function useGetAccessUser() {
  return useMutation({
    mutationFn: (body) => userAcces.GetAccessUser(body),
  });
}
