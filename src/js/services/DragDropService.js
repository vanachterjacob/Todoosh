// Drag and Drop Service
class DragDropService {
    constructor() {
        this.draggedElement = null;
        this.draggedType = null;
        this.onDrop = null;
        this.dropIndicator = null;
        this.lastDropTarget = null;
        this.dragStartY = 0;
        this.dropZoneSize = 0.8; // 80% of item height is drop zone
        this.lastClientY = 0;
        this.dropDebounceTimeout = null;
    }

    handleDragStart(event, type) {
        if (!event.target.dataset.id) return;

        this.draggedElement = event.target;
        this.draggedType = type;
        this.dragStartY = event.clientY;

        // Add dragging class for visual feedback
        event.target.classList.add('dragging');

        // Set drag image and effect
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', event.target.dataset.id);

        // Create semi-transparent drag image
        const dragImage = event.target.cloneNode(true);
        dragImage.style.opacity = '0.7';
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        event.dataTransfer.setDragImage(dragImage, 10, 10);
        setTimeout(() => document.body.removeChild(dragImage), 0);

        // Add dragging class to container for styling
        const container = type === 'list' ? 'listContainer' : 'todoList';
        document.getElementById(container).classList.add('dragging-active');
    }

    handleDragEnd(event) {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement = null;
            this.draggedType = null;
            this.removeDropIndicator();

            // Remove dragging class from container
            const containers = ['listContainer', 'todoList'];
            containers.forEach(id => {
                const container = document.getElementById(id);
                if (container) container.classList.remove('dragging-active');
            });
        }
        this.lastDropTarget = null;
        this.lastClientY = 0;
    }

    handleDragOver(event) {
        if (!this.draggedElement) return;

        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        const target = event.target.closest(`[data-type="${this.draggedType}"]`);
        if (!target || target === this.draggedElement) return;

        const targetRect = target.getBoundingClientRect();
        const targetY = targetRect.top + targetRect.height / 2;

        if (event.clientY < targetY) {
            target.classList.add('drop-above');
            target.classList.remove('drop-below');
        } else {
            target.classList.add('drop-below');
            target.classList.remove('drop-above');
        }
    }

    handleDrop(event) {
        if (!this.draggedElement) return;

        event.preventDefault();
        const target = event.target.closest(`[data-type="${this.draggedType}"]`);
        if (!target || target === this.draggedElement) return;

        // Remove drop indicators
        target.classList.remove('drop-above', 'drop-below');

        // Get the container and all items
        const container = target.parentElement;
        if (!container) return; // Guard against null container

        const items = Array.from(container.children).filter(
            item => item.dataset && item.dataset.type === this.draggedType
        );

        // Calculate the new index
        const draggedIndex = items.indexOf(this.draggedElement);
        let targetIndex = items.indexOf(target);

        if (draggedIndex === -1 || targetIndex === -1) return; // Guard against invalid indices

        const targetRect = target.getBoundingClientRect();
        const targetY = targetRect.top + targetRect.height / 2;

        if (event.clientY > targetY) {
            targetIndex++;
        }

        // Adjust target index if moving down
        if (draggedIndex < targetIndex) {
            targetIndex--;
        }

        // Call the onDrop callback with the relevant information
        if (this.onDrop) {
            this.onDrop(
                this.draggedElement.dataset.id,
                target.dataset.id,
                targetIndex,
                this.draggedType
            );
        }
    }

    updateDropIndicator(target, clientY) {
        this.removeDropIndicator();

        const rect = target.getBoundingClientRect();
        const dropIndicator = document.createElement('div');
        dropIndicator.classList.add('drop-indicator');

        // Use the dropZoneSize to determine drop position
        const dropAfter = clientY > rect.top + (rect.height * this.dropZoneSize);
        dropIndicator.classList.add(dropAfter ? 'drop-after' : 'drop-before');

        if (dropAfter) {
            target.parentNode.insertBefore(dropIndicator, target.nextSibling);
        } else {
            target.parentNode.insertBefore(dropIndicator, target);
        }

        this.dropIndicator = dropIndicator;
    }

    removeDropIndicator() {
        if (this.dropIndicator) {
            this.dropIndicator.remove();
            this.dropIndicator = null;
        }
    }
}

// Make DragDropService available globally
window.DragDropService = DragDropService; 