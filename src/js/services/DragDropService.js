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
            this.removeDropIndicators();

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
        if (!target || target === this.draggedElement) {
            this.removeDropIndicators();
            return;
        }

        // Clean up previous indicators if we're over a new target
        if (this.lastDropTarget && this.lastDropTarget !== target) {
            this.lastDropTarget.classList.remove('drop-above', 'drop-below');
        }

        const targetRect = target.getBoundingClientRect();
        const dropZone = this.calculateDropZone(event.clientY, targetRect);

        // Remove existing indicators
        target.classList.remove('drop-above', 'drop-below');

        // Add new indicator based on drop zone
        target.classList.add(dropZone === 'above' ? 'drop-above' : 'drop-below');

        this.lastDropTarget = target;
        this.lastClientY = event.clientY;
    }

    handleDrop(event) {
        if (!this.draggedElement) return;

        event.preventDefault();
        this.removeDropIndicators();

        const target = event.target.closest(`[data-type="${this.draggedType}"]`);
        if (!target || target === this.draggedElement) return;

        const container = target.parentElement;
        if (!container) return;

        const items = Array.from(container.children).filter(
            item => item.dataset && item.dataset.type === this.draggedType
        );

        const draggedIndex = items.indexOf(this.draggedElement);
        const targetIndex = items.indexOf(target);
        const draggedOrder = parseInt(this.draggedElement.dataset.order);
        const targetOrder = parseInt(target.dataset.order);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const targetRect = target.getBoundingClientRect();
        const dropZone = this.calculateDropZone(event.clientY, targetRect);

        // Calculate new order based on target's order
        let newOrder = targetOrder;
        if (dropZone === 'below') {
            newOrder = targetOrder + 1;
        }

        // Ensure index is within bounds
        newOrder = Math.max(0, Math.min(newOrder, items.length - 1));

        if (this.onDrop) {
            this.onDrop(
                this.draggedElement.dataset.id,
                target.dataset.id,
                newOrder,
                this.draggedType
            );
        }
    }

    calculateDropZone(clientY, targetRect) {
        const threshold = targetRect.top + (targetRect.height * 0.5);
        return clientY < threshold ? 'above' : 'below';
    }

    removeDropIndicators() {
        // Clean up all drop indicators in the container
        const container = this.draggedElement?.parentElement;
        if (container) {
            container.querySelectorAll(`[data-type="${this.draggedType}"]`).forEach(item => {
                item.classList.remove('drop-above', 'drop-below');
            });
        }

        if (this.lastDropTarget) {
            this.lastDropTarget.classList.remove('drop-above', 'drop-below');
            this.lastDropTarget = null;
        }

        this.removeDropIndicator();
        this.lastClientY = 0;
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