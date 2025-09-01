import { useInfiniteQuery } from "@tanstack/react-query";
import { useConvex } from "convex/react";
import { FunctionReference } from "convex/server";
import { useMemo } from "react";

type ConvexInfiniteQueryOptions<T> = {
  queryKey: string[];
  queryFn: FunctionReference<"query", any, any>;
  args?: any;
  pageSize?: number;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
};

export function useConvexInfiniteQuery<T>({
  queryKey,
  queryFn,
  args = {},
  pageSize = 10,
  enabled = true,
  staleTime = 1000 * 60 * 5, // 5 minutes default
  gcTime = 1000 * 60 * 30, // 30 minutes default
}: ConvexInfiniteQueryOptions<T>) {
  const convex = useConvex();

  const queryResult = useInfiniteQuery({
    queryKey: [...queryKey, args],
    queryFn: async ({ pageParam }) => {
      const paginationOpts = {
        cursor: pageParam || null,
        numItems: pageSize,
      };
      
      return await convex.query(queryFn, {
        ...args,
        paginationOpts,
      });
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: any) => {
      return lastPage?.isDone ? undefined : lastPage?.continueCursor;
    },
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const flatData = useMemo(() => {
    return queryResult.data?.pages?.flatMap((page) => page?.page || []) || [];
  }, [queryResult.data]);

  return {
    ...queryResult,
    data: flatData,
    hasNextPage: queryResult.hasNextPage,
    fetchNextPage: queryResult.fetchNextPage,
    isFetchingNextPage: queryResult.isFetchingNextPage,
  };
}