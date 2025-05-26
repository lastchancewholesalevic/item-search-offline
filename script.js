// Get references to DOM elements
const itemSearch = document.getElementById('item-search'); // Input for ID search
const searchBtn = document.getElementById('search-btn');
const refreshBtn = document.getElementById('refresh-btn');

const productList = document.getElementById('product-list');
const productCountElement = document.getElementById('product-count'); // Get reference to the count element
const loadingIndicatorElement = document.getElementById('loading-indicator'); // Get reference to the loading indicator

// Get references to product details elements
const productDetailsOverlay = document.getElementById('product-details-overlay');
const productDetailsModal = productDetailsOverlay.querySelector('.product-details-modal');
// Corrected: Get reference to the close button inside the modal
const closeDetailsBtn = productDetailsModal.querySelector('.close-btn');

// References to elements within the details modal
const detailDescriptionElement = document.getElementById('detail-description');
const detailItemNumberElement = document.getElementById('detail-item-number');
const detailGreatDealCostElement = document.getElementById('detail-great-deal-cost');
const detailSalvageCostPercent = document.getElementById('detail-salvage-cost-percent');
const detailSellPrice = document.getElementById('detail-costco-price');
const detailQTY = document.getElementById('detail-qty'); // Added QTY element
const detailVendedor = document.getElementById('detail-vendedor'); // Added Vendedor element
const detailComments = document.getElementById('detail-comments'); // Added Comments element

// References for dynamically calculated prices
const detailCategory10 = document.getElementById('detail-category-10');
const detailCategory15 = document.getElementById('detail-category-15');
const detailCategory20 = document.getElementById('detail-category-20');
const detailCategory25 = document.getElementById('detail-category-25');
const detailCategory30 = document.getElementById('detail-category-30');
const detailCategory40 = document.getElementById('detail-category-40');
const detailCategory50 = document.getElementById('detail-category-50');

const pageInfo = document.getElementById('page-info');

// --- Get references to Pagination Elements ---
const paginationControls = document.getElementById('pagination-controls'); // Get reference to the pagination container
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const pageInfoSpan = document.getElementById('page-info');
const pageHeader = document.getElementById('page-header');

// --- Global Variables for Pagination and Search ---
let allProductsData = []; // Stores all fetched products
let filteredProducts = []; // Stores currently filtered/searched products
// const productsPerPage = 10;
const itemsPerPage = 10; // Number of items to display per page
let currentPage = 1; // Current page number
let totalPages = 1; // Total number of pages
// Variable to store currently displayed products (after search/filter)
let currentDisplayedProducts = [];

// In script.js
const configurations = {
    'GREATDEALS': {
        title: 'Great & Good Deals',
        jsonFile: 'items-GREATDEALS.json'
    },
    'LASTCHANCE': { 
        title: 'Last Chance Wholesale',
        jsonFile: 'items-LASTCHANCE.json'
    },
    'BROTHERSHOME': { 
        title: 'Brothers Home Equipment',
        jsonFile: 'items-BROTHERSHOME.json'
    },
    'VICTORIA': { 
        title: 'Victoria',
        jsonFile: 'items-VICTORIA.json'
    },
    // ... more configurations
};


// --- NEW: Function to get URL parameters ---
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// --- NEW: Variables for dynamic title and JSON file ---
const storeName = getUrlParameter('store').toUpperCase() || 'GREATDEALS'; // Default if no parameter
const currentConfig = configurations[storeName] || {
     title: 'Great & Good Deals',
     jsonFile: 'items-GREATDEALS.json'
};
const jsonFileName = currentConfig.jsonFile || 'items-GREATDEALS.json'; // Default JSON if no parameter
pageHeader.textContent = `🛍️ Item Search - ${currentConfig.title}`;

// --- Firebase Configuration (Removed and commented out) ---
// const firebaseConfig = {
//     apiKey: "YOUR_API_KEY", // Ensure this is your actual API Key
//     authDomain: "YOUR_AUTH_DOMAIN", // Replace with your auth domain
//     databaseURL: "YOUR_DATABASE_URL", // Replace with your actual database URL
//     projectId: "YOUR_PROJECT_ID", // Replace with your project ID
//     storageBucket: "YOUR_STORAGE_BUCKET", // Replace with your storage bucket
//     messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your sender ID
//     appId: "YOUR_APP_ID" // Replace with your app ID
// };

// // Initialize Firebase
// firebase.initializeApp(firebaseConfig);

// // Get a reference to the database service and the 'products' node
// const database = firebase.database();
// const productsRef = database.ref('products');


// --- Product Data Handling Functions ---

// Function to get all products (fetches all for client-side filtering)
function getProducts() {
  return new Promise((resolve, reject) => {
    // Fetch your local JSON file
    // fetch('ITEM-GREATDEALS.json')
    fetch(jsonFileName)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Assign unique 'id' to each product if not already present
        // This mimics Firebase's push ID, essential for showProductDetails
        const productList = data.map((product, index) => ({
          id: product.ITEM || `unique-id-${index}`, // Use ITEM as ID if available, otherwise generate
          ...product
        }));

        // --- Default sorting by 'DESCRIPTION' in ascending order (as strings) ---
        productList.sort((a, b) => {
          const descriptionA = String(a.DESCRIPTION || '').trimStart();
          const descriptionB = String(b.DESCRIPTION || '').trimStart();
          return descriptionA.localeCompare(descriptionB);
        });

        allProductsData = productList; // Update allProductsData with fetched and processed data
        resolve(productList);
      })
      .catch(error => {
        console.error('Error fetching products from JSON:', error);
        reject(error);
      });
  });
}



function renderProducts(product) {

  productList.innerHTML = ''; // Clear current list

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = currentDisplayedProducts.slice(startIndex, endIndex);
  
  paginatedProducts.forEach(product => {
    const productItem = document.createElement('li');
    productItem.className = 'item-card';
    productItem.dataset.productId = product.id; // Store the product ID

    // Add click listener to the list item
    productItem.addEventListener('click', () => showProductDetails(product.id));
    
    // Display Item Number (assuming 'ITEM' is the key in your JSON)
    if (product.ITEM !== undefined) {
        const productItemNumberElement = document.createElement('span');
        productItemNumberElement.classList.add('product-item-number');
        productItemNumberElement.textContent = `#${product.ITEM}`;
        productItem.appendChild(productItemNumberElement);
    }

    // Display Description (assuming 'DESCRIPTION' is the key in your JSON)
    if (product.DESCRIPTION) { // Check if DESCRIPTION exists
            const productDESCRIPTIONElement = document.createElement('span');
            productDESCRIPTIONElement.classList.add('product-description');
            productDESCRIPTIONElement.textContent = product.DESCRIPTION;
            productItem.appendChild(productDESCRIPTIONElement);
    }

     // Display Sell Price (assuming 'SELL PRICE' is the key)
        if (product["SELL PRICE"] !== undefined) { // Check if SELL PRICE exists
            const productSellPriceElement = document.createElement('span');
            productSellPriceElement.classList.add('product-price');
            // Ensure it's a number before toFixed
            const sellPrice = typeof product["SELL PRICE"] === 'number' ? product["SELL PRICE"] : parseFloat(product["SELL PRICE"]);
            if (!isNaN(sellPrice)) {
                 productSellPriceElement.textContent = `Costco Price (MSRP): $${sellPrice.toFixed(2)}`; // Format price
                 productItem.appendChild(productSellPriceElement);
            }
        }

        
        // Display Great Deals Price Cost (assuming 'GREAT DEALS PRICE COST' is the key)
        if (product["GREAT DEALS PRICE COST"] !== undefined) { // Check if GREAT DEALS PRICE COST exists
            const productGreatDealsPriceElement = document.createElement('span');
            productGreatDealsPriceElement.classList.add('product-great-deals-price');
             // Ensure it's a number before toFixed
            const greatDealsPrice = typeof product["GREAT DEALS PRICE COST"] === 'number' ? product["GREAT DEALS PRICE COST"] : parseFloat(product["GREAT DEALS PRICE COST"]);
            if (!isNaN(greatDealsPrice)) {
                productGreatDealsPriceElement.textContent = `Cost (Default Cost): $${greatDealsPrice.toFixed(2)}`; // Format price
                productItem.appendChild(productGreatDealsPriceElement);
            }
        }


    // Append the complete product item to the list
    productList.appendChild(productItem);

  });
    
  }


  // Function to update the displayed product count
  function updateProductCountDisplay(count, total) {
      if (productCountElement) {
          // Calculate the range of displayed items
          const startIndex = (currentPage - 1) * itemsPerPage;
          const endIndex = Math.min(startIndex + count, total); // Ensure endIndex doesn't exceed total

          if (total === 0) {
               productCountElement.textContent = `Displayed Products: 0 of 0`;
          } else {
               productCountElement.textContent = `Displayed Products: ${startIndex + 1}-${endIndex} of ${total}`;
          }
      }
  }


 function showLoadingIndicator() {
      if (loadingIndicatorElement) {
          loadingIndicatorElement.classList.remove('hidden');
      }
      // Hide pagination controls when loading starts
      if (paginationControls) {
          paginationControls.classList.add('hidden');
      }
      clearProductList(); // Clear the list immediately when loading starts
      updateProductCountDisplay(0, 0); // Reset count display
  }

 // Function to clear the product list in the UI
  function clearProductList() {
    productList.innerHTML = '';
  }



function hideLoadingIndicator() {
  loadingIndicatorElement.classList.add('hidden');
}

// Function to display product details in the modal
function showProductDetails(id) {
  const product = allProductsData.find(p => String(p.id) === String(id)); // Ensure string comparison

  if (product) {

    detailDescriptionElement.textContent = product.DESCRIPTION || 'N/A';
    detailItemNumberElement.textContent = product.ITEM || 'N/A';
    detailSellPrice.textContent = `$${(product['SELL PRICE'] !== undefined && product['SELL PRICE'] !== null) ? parseFloat(product['SELL PRICE']).toFixed(2) : 'N/A'}`;
    detailSalvageCostPercent.textContent = product["SALVAGE %"] !== undefined ? `${parseFloat(product["SALVAGE %"])}%` : 'N/A'; 
    detailGreatDealCostElement.textContent = `$${(product['GREAT DEALS PRICE COST'] !== undefined && product['GREAT DEALS PRICE COST'] !== null) ? parseFloat(product['GREAT DEALS PRICE COST']).toFixed(2) : 'N/A'}`;
    detailComments.textContent = product["comments "] || 'N/A'; 

    // Populate dynamic category prices, ensuring they exist and are formatted
    detailCategory10.textContent = `$${(product['GREAT PRICE WITH 10% FROM COSTCO'] !== undefined && product['GREAT PRICE WITH 10% FROM COSTCO'] !== null) ? parseFloat(product['GREAT PRICE WITH 10% FROM COSTCO']).toFixed(2) : 'N/A'}`;
    detailCategory15.textContent = `$${(product['GREAT PRICE WITH 15% FROM COSTCO2'] !== undefined && product['GREAT PRICE WITH 15% FROM COSTCO2'] !== null) ? parseFloat(product['GREAT PRICE WITH 15% FROM COSTCO2']).toFixed(2) : 'N/A'}`;
    detailCategory20.textContent = `$${(product['GREAT PRICE WITH 20% FROM COSTCO'] !== undefined && product['GREAT PRICE WITH 20% FROM COSTCO'] !== null) ? parseFloat(product['GREAT PRICE WITH 20% FROM COSTCO']).toFixed(2) : 'N/A'}`;
    detailCategory25.textContent = `$${(product['GREAT PRICE WITH 25% FROM COSTCO'] !== undefined && product['GREAT PRICE WITH 25% FROM COSTCO'] !== null) ? parseFloat(product['GREAT PRICE WITH 25% FROM COSTCO']).toFixed(2) : 'N/A'}`;
    detailCategory30.textContent = `$${(product['GREAT PRICE WITH 30% FROM COSTCO3'] !== undefined && product['GREAT PRICE WITH 30% FROM COSTCO3'] !== null) ? parseFloat(product['GREAT PRICE WITH 30% FROM COSTCO3']).toFixed(2) : 'N/A'}`;
    detailCategory40.textContent = `$${(product['GREAT PRICE WITH 40% FROM COSTCO2'] !== undefined && product['GREAT PRICE WITH 40% FROM COSTCO2'] !== null) ? parseFloat(product['GREAT PRICE WITH 40% FROM COSTCO2']).toFixed(2) : 'N/A'}`;
    detailCategory50.textContent = `$${(product['GREAT PRICE WITH 50% FROM COSTCO22'] !== undefined && product['GREAT PRICE WITH 50% FROM COSTCO22'] !== null) ? parseFloat(product['GREAT PRICE WITH 50% FROM COSTCO22']).toFixed(2) : 'N/A'}`;

    // productDetailsOverlay.classList.remove('hidden');
    productDetailsOverlay.style.display = '';

  } else {
    console.error('Product not found:', id);
  }
}


// Function to hide the product details modal
function hideProductDetails() {
  // productDetailsOverlay.classList.add('hidden');
  productDetailsOverlay.style.display = 'none';
}


// Function to filter products based on search input

 async function searchProducts() {
    const searchValue = itemSearch.value.trim().toLowerCase();

    showLoadingIndicator(); // Show indicator and hide pagination
    hideProductDetails(); // Ensure modal is hidden when searching starts

    // If search terms are empty, just load the initial products (which will handle pagination)
    if (searchValue === '' ) {
        // Re-render the currentDisplayedProducts (which should be all products, already sorted by Description)
        currentDisplayedProducts = allProductsData; // Ensure we are working with the full dataset
        currentPage = 1; // Reset to first page for new search/clear
        renderCurrentPage(); // Render and handle pagination visibility
        hideLoadingIndicator(); // Hide indicator after rendering
        return;
    }

    try {
      // Filter the globally stored allProductsData array
      let matchingProducts = allProductsData.filter(product => {
         // Ensure product is an object and has properties before accessing them for safety
        const description = String(product && product.DESCRIPTION || '').toLowerCase();
        const item = String(product && product.ITEM || '').toLowerCase();

        if (searchValue !== '') {
             return description.includes(searchValue) || item.includes(searchValue);
        }
         return false;
      });

      // --- Custom sorting for search results ---
      // Prioritize exact Item ID matches, then sort by Description
      // HIGHLIGHT START
      if (searchValue !== '') { // Apply this sorting only if an Item ID search term is present
          matchingProducts.sort((a, b) => {
              const itemA = String(a.ITEM || '');
              const itemB = String(b.ITEM || '');
              const descriptionA = String(a.DESCRIPTION || '').toLowerCase();
              const descriptionB = String(b.DESCRIPTION || '').toLowerCase();

              // Check for exact match of the searchIdTerm
              const aIsExactMatch = itemA === searchValue;
              const bIsExactMatch = itemB === searchValue;

              if (aIsExactMatch && !bIsExactMatch) {
                  return -1; // 'a' comes first (exact match)
              } else if (!aIsExactMatch && bIsExactMatch) {
                  return 1; // 'b' comes first (exact match)
              } else {
                  // If neither or both are exact matches, sort by Description
                  return descriptionA.localeCompare(descriptionB);
              }
          });
      } else {
          // If no Item ID search term, maintain the default Description sort
          // (which is already applied to allProductsData)
          // No additional sort needed here as filtering preserves the original order.
      }
      // HIGHLIGHT END


      // Update currentDisplayedProducts with the search results
      currentDisplayedProducts = matchingProducts;

      // Reset to the first page for the search results
      currentPage = 1;

      // Render the first page of search results and handle pagination visibility
      renderCurrentPage();

    } catch (error) {
      console.error('Error during search:', error);
      productList.innerHTML = '<p>Error searching for products.</p>';
      updateProductCountDisplay(0, 0);
      renderPaginationControls(); // Render controls (will be disabled/hidden) even on error
      // searchBtn.innerHTML = 'Search';
    } finally {
        hideLoadingIndicator(); // Hide loading indicator
        
    }
   
  }


// Function to load products initially or after a refresh
// async function loadProducts() {

  // Function to load products from Firebase and display them (initial load or refresh)
  async function loadProducts() {

    showLoadingIndicator(); // Show indicator and hide pagination
   
    
    try {
      // Fetch ALL products and update allProductsData
      const allProducts = await getProducts(); // getProducts fetches ALL and updates allProductsData

      // Set currentDisplayedProducts to all fetched products initially
      currentDisplayedProducts = allProducts;

      // Reset to the first page when loading new data
      currentPage = 1;

      // Render the first page of products and handle pagination visibility
      renderCurrentPage(currentDisplayedProducts);

    } catch (error) {
      console.error('Error loading products:', error);
      productList.innerHTML = '<p>Error loading products.</p>';
      updateProductCountDisplay(0, 0);
      renderPaginationControls(); // Render controls (will be disabled/hidden) even on error
    } finally {
        hideLoadingIndicator(); // Hide loading indicator
    }
  }

 // --- Pagination Functions ---

  // Function to render the current page of products
  function renderCurrentPage() {

      clearProductList();
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const productsToRender = currentDisplayedProducts.slice(startIndex, endIndex);


      if (productsToRender.length === 0 && currentDisplayedProducts.length > 0) {
          // If we landed on an empty page (e.g., last item of last page deleted), go back a page
          if (currentPage > 1) {
              currentPage--;
              renderCurrentPage(); // Re-render the previous page
              return; // Exit this call to avoid double rendering
          } else {
              // If no products at all in the filtered list
              productList.innerHTML = '<p>No products found.</p>';
          }
      } else if (productsToRender.length === 0 && currentDisplayedProducts.length === 0) {
           // If no products at all after initial load or search
           productList.innerHTML = '<p>No products found.</p>';
      }
      else {
          productsToRender.forEach(renderProducts);
      }

      updateProductCountDisplay(productsToRender.length, currentDisplayedProducts.length);
      renderPaginationControls();

      // Show pagination controls only if there are products to display
      if (paginationControls) {
          if (currentDisplayedProducts.length > 0) {
              paginationControls.classList.remove('hidden');
          } else {
              paginationControls.classList.add('hidden');
          }
      }
      
  }

// Function to update pagination controls (buttons and page info)
function updatePaginationControls(totalProducts) {
  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  
  if (totalProducts <= itemsPerPage) {
    paginationControls.classList.add('hidden'); // Hide if only one page or less
  } else {
    paginationControls.classList.remove('hidden');
  }

  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}


function renderPaginationControls() {
      totalPages = Math.ceil(currentDisplayedProducts.length / itemsPerPage);
      pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages}`;
      prevPageBtn.disabled = currentPage === 1;
      nextPageBtn.disabled = currentPage === totalPages || totalPages === 0; // Disable next if on last page or no products
  }


  // Function to change the current page
  function changePage(direction) {
      if (direction === 'next' && currentPage < totalPages) {
          currentPage++;
      } else if (direction === 'prev' && currentPage > 1) {
          currentPage--;
      }
      renderCurrentPage();
  }

// Function to clear search inputs and reload all products
function clearElements() {
    itemSearch.value = "";
    hideProductDetails(); // Ensure modal is hidden when clearing
    // Load all products again and reset pagination
    loadProducts();
}


// --- Event Listeners and Initialization ---


// Event listener for the "Refresh" button
refreshBtn.addEventListener('click', clearElements);

// Add event listeners for 'Enter' key press on search inputs

itemSearch.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    searchProducts();
    
  }
});



// Event listener for the close button on the details modal
closeDetailsBtn.addEventListener('click', hideProductDetails);

// Optional: Close modal if clicking outside the modal content
productDetailsOverlay.addEventListener('click', (event) => {
    // Check if the click target is the overlay itself, not the modal content inside it
    if (event.target === productDetailsOverlay) {
        hideProductDetails();
    }
});

// --- Pagination Event Listeners ---
prevPageBtn.addEventListener('click', () => changePage('prev'));
nextPageBtn.addEventListener('click', () => changePage('next'));

// Add hover effect to item cards
document.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
            
    card.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0) scale(1)';
    });
});

 // Add some interactive functionality
//  searchBtn.addEventListener('click', function() {
//   this.innerHTML = '<span class="loading"></span> Searching...';
//   searchProducts();

//     // Revert button text after a delay
//     setTimeout(() => {
//       this.innerHTML = 'Search';
//     }, 1000);
// });

  // Event listener for the "Search" button
  searchBtn.addEventListener('click', searchProducts);


// CRUCIAL FIX - Ensure the modal is hidden immediately on script load
// Also, call loadProducts to populate the initial list
hideProductDetails();
loadProducts();



