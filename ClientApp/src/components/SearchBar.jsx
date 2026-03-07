import { Search } from 'lucide-react';
import { useState } from 'react';
import { debounce } from '../utils/helpers';

const SearchBar = ({ onSearch, placeholder = 'Buscar...' }) => {
  const [value, setValue] = useState('');

  const debouncedSearch = debounce((searchTerm) => {
    onSearch(searchTerm);
  }, 300);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
      />
    </div>
  );
};

export default SearchBar;
