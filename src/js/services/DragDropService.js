class DragDropService {
    constructor() {
        this.draggedElement = null;
        this.draggedElementType = null; // 'list' or 'todo'
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
        this.draggedElementType = type;
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
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        // Debounce the drag over handling to improve performance
        if (this.dropDebounceTimeout) {
            clearTimeout(this.dropDebounceTimeout);
        }

        // Only update if we've moved at least 5 pixels
        if (Math.abs(this.lastClientY - event.clientY) < 5) {
            return;
        }
        this.lastClientY = event.clientY;

        this.dropDebounceTimeout = setTimeout(() => {
            const dropTarget = this.findNearestDropTarget(event);
            if (!dropTarget || dropTarget === this.draggedElement) {
                this.removeDropIndicator();
                return;
            }

            const dropTargetType = dropTarget.dataset.type;
            if (dropTargetType !== this.draggedElementType) {
                this.removeDropIndicator();
                return;
            }

            // Don't update if we're still over the same target with the same position
            if (this.lastDropTarget === dropTarget) return;
            this.lastDropTarget = dropTarget;

            this.updateDropIndicator(dropTarget, event.clientY);
        }, 10);
    }

    findNearestDropTarget(event) {
        const container = this.draggedElementType === 'list' ? 'listContainer' : 'todoList';
        const items = Array.from(document.getElementById(container).children)
            .filter(child => child.dataset && child.dataset.id);

        let closestItem = null;
        let closestDistance = Infinity;

        items.forEach(item => {
            if (item === this.draggedElement) return;

            const rect = item.getBoundingClientRect();
            const itemMiddle = rect.top + rect.height / 2;
            const distance = Math.abs(event.clientY - itemMiddle);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestItem = item;
            }
        });

        return closestItem;
    }

    handleDrop(event) {
        event.preventDefault();

        const dropTarget = this.findNearestDropTarget(event);
        if (!dropTarget || dropTarget === this.draggedElement) return;

        const draggedId = event.dataTransfer.getData('text/plain');
        const dropTargetId = dropTarget.dataset.id;

        if (this.onDrop) {
            const container = dropTarget.parentNode;
            const children = Array.from(container.children)
                .filter(child => child.dataset && child.dataset.id);

            let newIndex = children.indexOf(dropTarget);

            // Adjust index based on drop position
            const rect = dropTarget.getBoundingClientRect();
            const dropAfter = event.clientY > rect.top + (rect.height * this.dropZoneSize);
            if (dropAfter) {
                newIndex++;
            }

            this.onDrop(draggedId, dropTargetId, newIndex, this.draggedElementType);
        }

        this.removeDropIndicator();
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