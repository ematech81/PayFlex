import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList } from 'react-native';

const CategoriesScreen = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          'https://vtucreator.com/demo/api/category'
        );

        if (!response.ok) {
          throw new Error('Unable to fetch categories');
        }

        const data = await response.json();

        // API returns an array directly
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View>
      <Text>Total Categories: {categories.length}</Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <Text>
            {item.displayName} ({item.name})
          </Text>
        )}
      />
    </View>
  );
};

export default CategoriesScreen;
