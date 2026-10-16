import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { slotService } from "@/services/slotService";

export const slotKeys = {
  all: ["slots"],
  list: (params) => [...slotKeys.all, "list", params],
  detail: (id) => [...slotKeys.all, "detail", id],
};

export function useSlots(params = {}, options = {}) {
  return useQuery({
    queryKey: slotKeys.list(params),
    queryFn: () => slotService.list(params),
    ...options,
  });
}

export function useSlot(id, options = {}) {
  return useQuery({
    queryKey: slotKeys.detail(id),
    queryFn: () => slotService.get(id),
    enabled: Boolean(id),
    ...options,
  });
}

export function useGenerateSlots() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: slotService.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slotKeys.all });
    },
  });
}

export function useRegenerateSlots() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: slotService.regenerate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: slotKeys.all });
    },
  });
}

export function useUpdateSlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => slotService.update(id, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: slotKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: slotKeys.all });
    },
  });
}
