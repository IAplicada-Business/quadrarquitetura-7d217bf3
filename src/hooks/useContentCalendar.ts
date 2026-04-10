import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, format } from "date-fns";
import type { ContentPost } from "./useContentPosts";

export function useContentCalendar(month: number, year: number) {
  const { user } = useAuth();
  const firstDay = format(startOfMonth(new Date(year, month)), "yyyy-MM-dd");
  const lastDay = format(endOfMonth(new Date(year, month)), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["content_calendar", year, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_posts" as any)
        .select("*")
        .gte("scheduled_date", firstDay)
        .lte("scheduled_date", lastDay)
        .order("scheduled_date");
      if (error) throw error;
      return (data || []) as unknown as ContentPost[];
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user,
  });
}
