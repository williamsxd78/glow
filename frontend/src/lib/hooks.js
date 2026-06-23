import useSWR from "swr";
import { api } from "./api";

const fetcher = (url) => api.get(url).then((r) => r.data);

export const useSettings = () => useSWR("/settings", fetcher);
export const useReviews = () => useSWR("/reviews", fetcher);
export const useFaqs = () => useSWR("/faqs", fetcher);
export const useGallery = () => useSWR("/gallery", fetcher);
