import { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Category } from "@shared/schema";

interface CourseFiltersProps {
  categories: Category[];
  selectedCategories: number[];
  setSelectedCategories: Dispatch<SetStateAction<number[]>>;
  priceFilter: string[];
  setPriceFilter: Dispatch<SetStateAction<string[]>>;
}

export default function CourseFilters({
  categories,
  selectedCategories,
  setSelectedCategories,
  priceFilter,
  setPriceFilter
}: CourseFiltersProps) {
  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handlePriceChange = (value: string) => {
    setPriceFilter(prev => 
      prev.includes(value)
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
  };

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setPriceFilter([]);
  };

  return (
    <div className="bg-gray-900 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4 uppercase">Filters</h3>
      
      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="font-bold uppercase mb-2">Category</h4>
        <div className="space-y-2">
          {categories.map(category => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`category-${category.id}`} 
                checked={selectedCategories.includes(category.id)} 
                onCheckedChange={() => handleCategoryChange(category.id)}
              />
              <Label 
                htmlFor={`category-${category.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      {/* Price Filter */}
      <div className="mb-6">
        <h4 className="font-bold uppercase mb-2">Price</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="price-free" 
              checked={priceFilter.includes("free")} 
              onCheckedChange={() => handlePriceChange("free")}
            />
            <Label 
              htmlFor="price-free"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Free
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="price-paid" 
              checked={priceFilter.includes("paid")} 
              onCheckedChange={() => handlePriceChange("paid")}
            />
            <Label 
              htmlFor="price-paid"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Paid
            </Label>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Button 
          className="w-full bg-[#00d4ff] text-black hover:bg-[#00d4ff]/90 rounded-full"
          type="button"
          disabled={selectedCategories.length === 0 && priceFilter.length === 0}
          onClick={handleResetFilters}
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
