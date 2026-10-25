import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { forkTemplate } from '../services/templatesApi';

export function useForkTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: forkTemplate,
    onSuccess: (forked) => {
      toast.success(`"${forked.name}" duplicated into My Templates`);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to duplicate template');
    },
  });
}