import { useApp } from '../contexts/FixieAppContext';

export function useToast() {
  const { addToast } = useApp();
  return { toast: addToast };
}
