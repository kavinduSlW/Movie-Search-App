// Professional Movie Search App with Advanced Features
class MovieApp {
  constructor() {
    this.API_KEY = '4e831b6a'; // OMDB API key
    this.currentPage = 1;
    this.currentSearch = '';
    this.totalResults = 0;
    this.searchHistoryData = this.loadSearchHistory();
    
    this.initializeElements();
    this.bindEvents();
    this.initializeTheme();
    this.updateHistoryDisplay();
  }

  // Initialize DOM elements
  initializeElements() {
    this.searchInput = document.getElementById('search-input');
    this.searchBtn = document.getElementById('search-btn');
    this.moviesContainer = document.getElementById('movies-container');
    this.loadMoreBtn = document.getElementById('load-more-btn');
    this.loader = document.getElementById('loader');
    this.darkModeToggle = document.getElementById('dark-mode-toggle');
    this.historyBtn = document.getElementById('history-btn');
    this.searchHistoryEl = document.getElementById('search-history');
    this.historyList = document.getElementById('history-list');
    this.clearHistoryBtn = document.getElementById('clear-history');
    this.modal = document.getElementById('movie-modal');
    this.modalClose = document.getElementById('modal-close');
    this.movieDetails = document.getElementById('movie-details');
    this.searchResultsInfo = document.getElementById('search-results-info');
    this.resultsTitle = document.getElementById('results-title');
    this.resultsCount = document.getElementById('results-count');
    this.searchIcon = document.querySelector('.search-icon');
  }

  // Bind event listeners
  bindEvents() {
    // Search functionality
    this.searchBtn.addEventListener('click', () => this.handleSearch());
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleSearch();
    });
    
    // Update search icon based on input
    this.searchInput.addEventListener('input', () => this.updateSearchIcon());
    
    // Load more movies
    this.loadMoreBtn.addEventListener('click', () => this.loadMoreMovies());
    
    // Dark mode toggle
    this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
    
    // Search history
    this.historyBtn.addEventListener('click', () => this.toggleSearchHistory());
    this.clearHistoryBtn.addEventListener('click', () => this.clearSearchHistory());
    
    // Modal functionality
    this.modalClose.addEventListener('click', () => this.closeModal());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target.classList.contains('modal-overlay')) {
        this.closeModal();
      }
    });
    
    // Close search history when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.historyBtn.contains(e.target) && !this.searchHistoryEl.contains(e.target)) {
        this.searchHistoryEl.classList.add('hidden');
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.searchHistoryEl.classList.add('hidden');
      }
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        this.searchInput.focus();
      }
    });
  }

  // Initialize theme based on saved preference or system preference
  initializeTheme() {
    const savedTheme = localStorage.getItem('movie-app-theme');
    const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else if (systemDarkMode) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
  }

  // Set theme and update UI
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('movie-app-theme', theme);
    
    const icon = this.darkModeToggle.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'fas fa-sun';
      this.darkModeToggle.title = 'Switch to Light Mode';
    } else {
      icon.className = 'fas fa-moon';
      this.darkModeToggle.title = 'Switch to Dark Mode';
    }
  }

  // Toggle between light and dark mode
  toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  // Update search icon based on input content
  updateSearchIcon() {
    const query = this.searchInput.value.trim();
    if (query) {
      // Change to typing icon when user is typing
      this.searchIcon.className = 'fas fa-keyboard search-icon';
    } else {
      // Default search icon when empty
      this.searchIcon.className = 'fas fa-search search-icon';
    }
  }

  // Handle search with validation and history
  handleSearch() {
    const query = this.searchInput.value.trim();
    
    if (!query) {
      this.showNotification('Please enter a search term', 'error');
      return;
    }
    
    if (query.length < 2) {
      this.showNotification('Search term must be at least 2 characters', 'error');
      return;
    }
    
    // Change icon to loading state
    this.searchIcon.className = 'fas fa-spinner fa-spin search-icon';
    
    this.currentSearch = query;
    this.currentPage = 1;
    this.moviesContainer.innerHTML = '';
    this.searchResultsInfo.classList.add('hidden');
    this.searchHistoryEl.classList.add('hidden');
    this.addToSearchHistory(query);
    this.fetchMovies(query, this.currentPage);
  }

  // Load more movies for pagination
  loadMoreMovies() {
    this.currentPage++;
    this.fetchMovies(this.currentSearch, this.currentPage, true);
  }

  // Fetch movies from OMDB API with error handling
  async fetchMovies(query, page, append = false) {
    try {
      this.showLoader(true);
      this.loadMoreBtn.classList.add('hidden');
      
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${this.API_KEY}&s=${encodeURIComponent(query)}&page=${page}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.Response === 'True') {
        this.totalResults = parseInt(data.totalResults);
        this.displayMovies(data.Search, append);
        this.updateSearchInfo(query, this.totalResults);
        
        // Show load more button if there are more results
        if (this.currentPage * 10 < this.totalResults) {
          this.loadMoreBtn.classList.remove('hidden');
        }
      } else {
        if (page === 1) {
          this.showNoResults(query, data.Error);
        } else {
          this.showNotification('No more results available', 'info');
        }
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      this.showError('Failed to fetch movies. Please check your connection and try again.');
    } finally {
      this.showLoader(false);
      // Reset search icon
      this.searchIcon.className = 'fas fa-search search-icon';
    }
  }

  // Display movies in the grid
  displayMovies(movies, append = false) {
    if (!append) {
      this.moviesContainer.innerHTML = '';
    }
    
    movies.forEach(movie => {
      const movieCard = this.createMovieCard(movie);
      this.moviesContainer.appendChild(movieCard);
    });
    
    // Add smooth scroll animation for new content
    if (append) {
      const lastCard = this.moviesContainer.lastElementChild;
      lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // Create individual movie card element
  createMovieCard(movie) {
    const movieCard = document.createElement('div');
    movieCard.classList.add('movie-card');
    movieCard.setAttribute('data-imdb-id', movie.imdbID);
    
    const posterUrl = movie.Poster !== 'N/A' 
      ? movie.Poster 
      : 'https://via.placeholder.com/300x450/64748b/ffffff?text=No+Image+Available';
    
    movieCard.innerHTML = `
      <img src="${posterUrl}" alt="${movie.Title}" loading="lazy" />
      <div class="movie-info">
        <h3>${movie.Title}</h3>
        <div class="movie-year">${movie.Year}</div>
        <span class="movie-type">${movie.Type}</span>
      </div>
    `;
    
    // Add click event to show movie details
    movieCard.addEventListener('click', () => this.showMovieDetails(movie.imdbID));
    
    return movieCard;
  }

  // Fetch and display detailed movie information
  async showMovieDetails(imdbID) {
    try {
      this.showLoader(true);
      
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${this.API_KEY}&i=${imdbID}&plot=full`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const movie = await response.json();
      
      if (movie.Response === 'True') {
        this.displayMovieModal(movie);
      } else {
        this.showNotification('Failed to load movie details', 'error');
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
      this.showNotification('Failed to load movie details', 'error');
    } finally {
      this.showLoader(false);
    }
  }

  // Display movie details in modal
  displayMovieModal(movie) {
    const posterUrl = movie.Poster !== 'N/A' 
      ? movie.Poster 
      : 'https://via.placeholder.com/300x450/64748b/ffffff?text=No+Image+Available';
    
    const genres = movie.Genre !== 'N/A' ? movie.Genre.split(', ') : [];
    const genreTags = genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('');
    
    const ratings = [];
    if (movie.imdbRating !== 'N/A') {
      ratings.push(`<div class="rating-item"><i class="fab fa-imdb"></i><span class="rating-value">${movie.imdbRating}/10</span></div>`);
    }
    if (movie.Ratings) {
      movie.Ratings.forEach(rating => {
        if (rating.Source === 'Rotten Tomatoes') {
          ratings.push(`<div class="rating-item"><i class="fas fa-tomato"></i><span class="rating-value">${rating.Value}</span></div>`);
        }
        if (rating.Source === 'Metacritic') {
          ratings.push(`<div class="rating-item"><i class="fas fa-star"></i><span class="rating-value">${rating.Value}</span></div>`);
        }
      });
    }
    
    this.movieDetails.innerHTML = `
      <div class="movie-poster">
        <img src="${posterUrl}" alt="${movie.Title}" />
      </div>
      <div class="movie-meta">
        <h1 class="movie-title">${movie.Title}</h1>
        <div class="movie-subtitle">${movie.Year} • ${movie.Rated} • ${movie.Runtime}</div>
        
        ${ratings.length > 0 ? `<div class="movie-rating">${ratings.join('')}</div>` : ''}
        
        ${genreTags ? `<div class="movie-genres">${genreTags}</div>` : ''}
        
        ${movie.Plot !== 'N/A' ? `<div class="movie-plot">${movie.Plot}</div>` : ''}
        
        <div class="movie-info-grid">
          ${movie.Director !== 'N/A' ? `
            <div class="info-item">
              <div class="info-label">Director</div>
              <div class="info-value">${movie.Director}</div>
            </div>
          ` : ''}
          
          ${movie.Writer !== 'N/A' ? `
            <div class="info-item">
              <div class="info-label">Writer</div>
              <div class="info-value">${movie.Writer}</div>
            </div>
          ` : ''}
          
          ${movie.Actors !== 'N/A' ? `
            <div class="info-item">
              <div class="info-label">Starring</div>
              <div class="info-value">${movie.Actors}</div>
            </div>
          ` : ''}
          
          ${movie.Country !== 'N/A' ? `
            <div class="info-item">
              <div class="info-label">Country</div>
              <div class="info-value">${movie.Country}</div>
            </div>
          ` : ''}
          
          ${movie.Language !== 'N/A' ? `
            <div class="info-item">
              <div class="info-label">Language</div>
              <div class="info-value">${movie.Language}</div>
            </div>
          ` : ''}
          
          ${movie.BoxOffice !== 'N/A' ? `
            <div class="info-item">
              <div class="info-label">Box Office</div>
              <div class="info-value">${movie.BoxOffice}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    this.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  // Close movie details modal
  closeModal() {
    this.modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  // Show/hide loading animation
  showLoader(show) {
    if (show) {
      this.loader.classList.remove('hidden');
    } else {
      this.loader.classList.add('hidden');
    }
  }

  // Update search results information
  updateSearchInfo(query, totalResults) {
    this.resultsTitle.textContent = `Search Results for "${query}"`;
    this.resultsCount.textContent = `Found ${totalResults.toLocaleString()} result${totalResults !== 1 ? 's' : ''}`;
    this.searchResultsInfo.classList.remove('hidden');
  }

  // Show no results message
  showNoResults(query, error) {
    this.moviesContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
        <i class="fas fa-film" style="font-size: 4rem; color: var(--text-tertiary); margin-bottom: 1rem;"></i>
        <h3 style="margin-bottom: 1rem; color: var(--text-secondary);">No Results Found</h3>
        <p style="color: var(--text-tertiary); max-width: 400px; margin: 0 auto;">
          ${error === 'Movie not found!' 
            ? `We couldn't find any movies matching "${query}". Try different keywords or check your spelling.`
            : error || 'No movies found for your search.'}
        </p>
      </div>
    `;
    this.searchResultsInfo.classList.add('hidden');
  }

  // Show error message
  showError(message) {
    this.moviesContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--error-color); margin-bottom: 1rem;"></i>
        <h3 style="margin-bottom: 1rem; color: var(--error-color);">Something went wrong</h3>
        <p style="color: var(--text-tertiary); max-width: 400px; margin: 0 auto;">${message}</p>
      </div>
    `;
    this.searchResultsInfo.classList.add('hidden');
  }

  // Show notification toast
  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-left: 4px solid ${type === 'error' ? 'var(--error-color)' : type === 'success' ? 'var(--success-color)' : 'var(--primary-color)'};
      color: var(--text-primary);
      padding: 1rem 1.5rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      animation: slideInRight 0.3s ease;
      max-width: 350px;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);
  }

  // Search history management
  addToSearchHistory(query) {
    // Remove if already exists to avoid duplicates
    this.searchHistoryData = this.searchHistoryData.filter(item => item.query !== query);
    
    // Add to beginning of array
    this.searchHistoryData.unshift({
      query: query,
      timestamp: Date.now()
    });
    
    // Keep only last 10 searches
    this.searchHistoryData = this.searchHistoryData.slice(0, 10);
    
    this.saveSearchHistory();
    this.updateHistoryDisplay();
  }

  loadSearchHistory() {
    try {
      const history = localStorage.getItem('movie-search-history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading search history:', error);
      return [];
    }
  }

  saveSearchHistory() {
    try {
      localStorage.setItem('movie-search-history', JSON.stringify(this.searchHistoryData));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }

  updateHistoryDisplay() {
    if (this.searchHistoryData.length === 0) {
      this.historyList.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-tertiary);">No recent searches</div>';
      return;
    }
    
    this.historyList.innerHTML = this.searchHistoryData
      .map(item => `
        <div class="history-item" data-query="${item.query}">
          <i class="fas fa-history"></i>
          <span>${item.query}</span>
        </div>
      `)
      .join('');
    
    // Add click events to history items
    this.historyList.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const query = item.getAttribute('data-query');
        this.searchInput.value = query;
        this.handleSearch();
        this.searchHistoryEl.classList.add('hidden');
      });
    });
  }

  toggleSearchHistory() {
    this.searchHistoryEl.classList.toggle('hidden');
  }

  clearSearchHistory() {
    this.searchHistoryData = [];
    this.saveSearchHistory();
    this.updateHistoryDisplay();
    this.showNotification('Search history cleared', 'success');
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new MovieApp();
});

// Add CSS animations for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(notificationStyles);
