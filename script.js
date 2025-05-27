document.addEventListener('DOMContentLoaded', () => {
    // Mobile menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Function to show custom popup
    function showPopup(title, message, type = 'message', callback = null) {
        const popup = document.getElementById('custom-popup');
        const popupTitle = document.getElementById('popup-title');
        const popupMessage = document.getElementById('popup-message');
        const popupButtons = document.getElementById('popup-buttons');

        if (!popup || !popupTitle || !popupMessage || !popupButtons) {
            console.error('Popup elements not found');
            return;
        }

        popupTitle.textContent = title;
        popupMessage.textContent = message;
        popupButtons.innerHTML = '';

        if (type === 'confirm') {
            popupButtons.innerHTML = `
                <button id="popup-cancel" class="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700">Annuler</button>
                <button id="popup-confirm" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Confirmer</button>
            `;
            popup.classList.remove('hidden');

            document.getElementById('popup-cancel').addEventListener('click', () => {
                popup.classList.add('hidden');
            });

            document.getElementById('popup-confirm').addEventListener('click', () => {
                popup.classList.add('hidden');
                if (callback) callback();
            });
        } else {
            popupButtons.innerHTML = `
                <button id="popup-ok" class="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">OK</button>
            `;
            popup.classList.remove('hidden');

            document.getElementById('popup-ok').addEventListener('click', () => {
                popup.classList.add('hidden');
            });
        }
    }

    // Function to fetch and display glasses
    function loadGlasses(category = null) {
        const url = category ? `/api/glasses?category=${category}` : '/api/glasses';
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) {
                    console.error('Expected an array, but got:', data);
                    showPopup('Erreur', 'Les données reçues ne sont pas valides.');
                    return;
                }
                const glassesGrid = document.getElementById('glasses-grid');
                const adminGlassesGrid = document.getElementById('admin-glasses-grid');
                const targetGrid = glassesGrid || adminGlassesGrid;

                if (targetGrid) {
                    targetGrid.innerHTML = '';
                    data.forEach(glass => {
                        const card = document.createElement('div');
                        card.className = 'glasses-card bg-white rounded-lg shadow-lg p-4';
                        card.dataset.brand = glass.brand;
                        card.innerHTML = `
                            <img src="produit/${glass.image}" alt="${glass.name}" class="w-full h-48 object-cover rounded-md mb-4">
                            <h3 class="text-lg font-semibold">${glass.name}</h3>
                            <p class="text-gray-600">Marque : ${glass.brand}</p>
                            <p class="text-gray-800 font-bold">Prix : ${glass.price} TND</p>
                            ${adminGlassesGrid ? `
                                <button class="edit-button bg-blue-600 text-white px-4 py-2 rounded-lg mt-2 mr-2" data-id="${glass.id}" data-name="${glass.name.replace(/"/g, '&quot;')}" data-brand="${glass.brand.replace(/"/g, '&quot;')}" data-price="${glass.price}" data-image="${glass.image}" data-category="${glass.category}">Modifier</button>
                                <button class="delete-button bg-red-600 text-white px-4 py-2 rounded-lg mt-2" data-id="${glass.id}">Supprimer</button>
                            ` : ''}
                        `;
                        targetGrid.appendChild(card);
                    });

                    // Add event listeners for edit and delete buttons
                    document.querySelectorAll('.edit-button').forEach(button => {
                        button.addEventListener('click', () => {
                            const id = button.dataset.id;
                            const name = button.dataset.name;
                            const brand = button.dataset.brand;
                            const price = button.dataset.price;
                            const image = button.dataset.image;
                            const category = button.dataset.category;
                            editGlass(id, name, brand, price, image, category);
                        });
                    });

                    document.querySelectorAll('.delete-button').forEach(button => {
                        button.addEventListener('click', () => {
                            deleteGlass(button.dataset.id);
                        });
                    });

                    const brandFilter = document.getElementById('brand-filter');
                    if (brandFilter) {
                        const brands = [...new Set(data.map(glass => glass.brand))];
                        brandFilter.innerHTML = '<option value="all">Toutes</option>';
                        brands.forEach(brand => {
                            const option = document.createElement('option');
                            option.value = brand;
                            option.textContent = brand;
                            brandFilter.appendChild(option);
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching glasses:', error);
                showPopup('Erreur', 'Échec du chargement des lunettes : ' + error.message);
            });
    }

    // Load glasses based on page
    const path = window.location.pathname;
    if (path.includes('homme.html')) {
        loadGlasses('Homme');
    } else if (path.includes('femme.html')) {
        loadGlasses('Femme');
    } else if (path.includes('enfant.html')) {
        loadGlasses('Enfant');
    } else if (path.includes('admin.html')) {
        loadGlasses();
    } else {
        loadGlasses();
    }

    // Brand filter
    const brandFilter = document.getElementById('brand-filter');
    if (brandFilter) {
        brandFilter.addEventListener('change', (e) => {
            const selectedBrand = e.target.value;
            const cards = document.querySelectorAll('.glasses-card');
            cards.forEach(card => {
                card.style.display = selectedBrand === 'all' || card.dataset.brand === selectedBrand ? 'block' : 'none';
            });
        });
    }

    // Admin form handling (for adding new glasses)
    const glassesForm = document.getElementById('glasses-form');
    if (glassesForm) {
        glassesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const brand = document.getElementById('brand').value;
            const price = document.getElementById('price').value;
            const imageInput = document.getElementById('image');
            const category = document.getElementById('category').value;

            if (!name || !brand || !price || !category) {
                showPopup('Erreur', 'Veuillez remplir tous les champs obligatoires.');
                return;
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('brand', brand);
            formData.append('price', price);
            formData.append('category', category);
            if (imageInput.files.length > 0) {
                formData.append('image', imageInput.files[0]);
            }

            fetch('/api/glasses', {
                method: 'POST',
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        console.error('Server error:', data.error);
                        showPopup('Erreur', 'Erreur : ' + data.error);
                        return;
                    }
                    loadGlasses();
                    glassesForm.reset();
                    showPopup('Succès', 'Lunettes ajoutées avec succès !');
                })
                .catch(error => {
                    console.error('Error adding glass:', error);
                    showPopup('Erreur', 'Échec de l\'ajout des lunettes : ' + error.message);
                });
        });

        const resetForm = document.getElementById('reset-form');
        if (resetForm) {
            resetForm.addEventListener('click', () => {
                glassesForm.reset();
            });
        }
    }

    // Edit modal handling
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-glasses-form');
    const closeEditModal = document.getElementById('close-edit-modal');

    if (editModal && editForm && closeEditModal) {
        closeEditModal.addEventListener('click', () => {
            editModal.classList.add('hidden');
        });

        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-glass-id').value;
            const name = document.getElementById('edit-name').value;
            const brand = document.getElementById('edit-brand').value;
            const price = document.getElementById('edit-price').value;
            const imageInput = document.getElementById('edit-image');
            const category = document.getElementById('edit-category').value;

            if (!name || !brand || !price || !category) {
                showPopup('Erreur', 'Veuillez remplir tous les champs obligatoires.');
                return;
            }

            const formData = new FormData();
            formData.append('name', name);
            formData.append('brand', brand);
            formData.append('price', price);
            formData.append('category', category);
            if (imageInput.files.length > 0) {
                formData.append('image', imageInput.files[0]);
            }

            fetch(`/api/glasses/${id}`, {
                method: 'PUT',
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        console.error('Server error:', data.error);
                        showPopup('Erreur', 'Erreur : ' + data.error);
                        return;
                    }
                    loadGlasses();
                    editModal.classList.add('hidden');
                    editForm.reset();
                    showPopup('Succès', 'Lunettes mises à jour avec succès !');
                })
                .catch(error => {
                    console.error('Error updating glass:', error);
                    showPopup('Erreur', 'Échec de la mise à jour des lunettes : ' + error.message);
                });
        });
    }

    // Edit glass function
    function editGlass(id, name, brand, price, image, category) {
        console.log('Opening edit modal for glass:', { id, name, brand, price, image, category });
        const editModal = document.getElementById('edit-modal');
        if (editModal) {
            document.getElementById('edit-glass-id').value = id;
            document.getElementById('edit-name').value = name;
            document.getElementById('edit-brand').value = brand;
            document.getElementById('edit-price').value = price;
            document.getElementById('edit-category').value = category;
            editModal.classList.remove('hidden');
        } else {
            console.error('Edit modal not found');
            showPopup('Erreur', 'Impossible d\'ouvrir le formulaire de modification.');
        }
    }

    // Delete glass function
    function deleteGlass(id) {
        showPopup('Confirmation', 'Voulez-vous vraiment supprimer cette paire de lunettes ?', 'confirm', () => {
            fetch(`/api/glasses/${id}`, { method: 'DELETE' })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(() => {
                    document.getElementById('admin-glasses-grid').innerHTML = '';
                    loadGlasses();
                    showPopup('Succès', 'Lunettes supprimées avec succès !');
                })
                .catch(error => {
                    console.error('Error deleting glass:', error);
                    showPopup('Erreur', 'Échec de la suppression des lunettes : ' + error.message);
                });
        });
    }
});