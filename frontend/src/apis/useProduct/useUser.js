import { useMutation } from "@tanstack/react-query";
import { users } from "../client/product/users";
export function useAllUsers() {
  return useMutation({
    mutationFn: (body) => users.GetAllUsers(body),
  });
}
export function useGetUserCompany() {
  return useMutation({
    mutationFn: (body) => users.GetUserCompany(body),
  });
}

// const {
//   data,
//   isLoading,
//   isFetchingNextPage,
//   fetchNextPage,
//   hasNextPage,
// } = useInfiniteQuery(
//   ['getAllUsers', valueselect?.value],  // Add value select filter if needed
//   fetchUsers,
//   {
//     getNextPageParam: (lastPage) => {
//       if (lastPage.meta.currentPage < lastPage.meta.lastPage) {
//         return lastPage.meta.currentPage + 1;
//       }
//       return undefined;
//     },
//   }
// );
