import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { searchUsers } from '../services/userService'
import Avatar from './Avatar'
import { Search, X, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const SearchBox = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef(null)
  const resultsRef = useRef(null)

  // Debounce para la búsqueda
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch(searchTerm)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  // Cerrar resultados al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = async (term) => {
    if (!term.trim() || !user?.id) return

    try {
      setIsSearching(true)
      const results = await searchUsers(term, user.id)
      setSearchResults(results)
      setShowResults(true)
    } catch (error) {
      console.error('Error buscando usuarios:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSearchResults([])
    setShowResults(false)
  }

  const handleResultClick = () => {
    setShowResults(false)
    setSearchTerm('')
    setSearchResults([])
  }

  return (
    <div className="relative">
      {/* Input de búsqueda */}
      <div ref={searchRef} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50" />
        <input
          type="text"
          placeholder="Buscar usuarios"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim() && setShowResults(true)}
          className="w-full bg-base-200 rounded-full py-3 pl-9 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-base-100 transition-all duration-200"
        />
        
        {/* Botón para limpiar búsqueda */}
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-base-content/50 hover:text-base-content transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Indicador de carga */}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {showResults && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300 rounded-2xl shadow-lg max-h-80 overflow-y-auto z-50"
        >
          {searchResults.length > 0 ? (
            <div className="p-2">
              <div className="text-xs text-base-content/60 px-3 py-2 border-b border-base-300">
                Usuarios encontrados
              </div>
              {searchResults.map((searchUser) => (
                <Link
                  key={searchUser.id}
                  to={`/user/${searchUser.id}`}
                  onClick={handleResultClick}
                  className="flex items-center space-x-3 p-3 hover:bg-base-200/50 rounded-lg transition-colors cursor-pointer"
                >
                  <Avatar 
                    src={searchUser.avatar_url}
                    alt={searchUser.username || 'Usuario'}
                    name={searchUser.username || 'Usuario'}
                    team={searchUser.team}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{searchUser.username}</p>
                    <p className="text-xs text-base-content/60 truncate">@{searchUser.username?.toLowerCase()}</p>
                    {searchUser.team && (
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-xs text-base-content/60">⚽ {searchUser.team}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : searchTerm.trim() && !isSearching ? (
            <div className="p-4 text-center text-base-content/60">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No se encontraron usuarios</p>
              <p className="text-xs">Intenta con otro término</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default SearchBox