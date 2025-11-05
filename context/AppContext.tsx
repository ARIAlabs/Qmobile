import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchCarousel, fetchFeedPosts, fetchMerchProducts, supabase } from '../lib/supabase';

type AppContextType = {
  carousel: any[];
  feedPosts: any[];
  merchProducts: any[];
  loading: boolean;
  refreshData: () => Promise<void>;
};

const AppContext = createContext<AppContextType>({
  carousel: [],
  feedPosts: [],
  merchProducts: [],
  loading: true,
  refreshData: async () => {},
});

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [carousel, setCarousel] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [merchProducts, setMerchProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      console.log('Starting to load data...');
      setLoading(true);
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Data loading timeout')), 10000); // 10 second timeout
      });
      
      // Race the data loading against the timeout
      const [carouselData, postsData, merchData] = await Promise.race([
        Promise.all([
          fetchCarousel(),
          fetchFeedPosts(),
          fetchMerchProducts(),
        ]),
        timeoutPromise
      ]) as [any[], any[], any[]];
      
      console.log('Data loaded successfully');
      console.log('- Carousel items:', carouselData.length);
      console.log('- Feed posts:', postsData.length);
      console.log('- Merch products:', merchData.length);
      
      setCarousel(carouselData);
      setFeedPosts(postsData);
      setMerchProducts(merchData);
    } catch (error) {
      console.error('Error loading data:', error);
      console.log('App will continue with empty data');
      // Set empty arrays so the app can still load
      setCarousel([]);
      setFeedPosts([]);
      setMerchProducts([]);
    } finally {
      console.log('Loading complete, setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Set up real-time subscriptions
    const carouselSubscription = supabase
      .channel('mobile_carousel_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mobile_carousel' },
        () => {
          console.log('Carousel updated, refreshing...');
          fetchCarousel().then(setCarousel);
        }
      )
      .subscribe();

    const postsSubscription = supabase
      .channel('fees_posts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fees_posts' },
        () => {
          console.log('Posts updated, refreshing...');
          fetchFeedPosts().then(setFeedPosts);
        }
      )
      .subscribe();

    const merchSubscription = supabase
      .channel('merch_products_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'merch_products' },
        () => {
          console.log('Merch products updated, refreshing...');
          fetchMerchProducts().then(setMerchProducts);
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(carouselSubscription);
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(merchSubscription);
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        carousel,
        feedPosts,
        merchProducts,
        loading,
        refreshData: loadData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;