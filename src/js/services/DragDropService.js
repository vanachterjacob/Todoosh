class DragDropService {
    constructor() {
        this.draggedElement = null;
        this.draggedElementType = null; // 'list' or 'todo'
        this.onDrop = null;
    }

    handleDragStart(event, type) {
        this.draggedElement = event.target;
        this.draggedElementType = type;

        event.target.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', event.target.dataset.id);
    }

    handleDragEnd(event) {
        if (this.draggedElement) {
            this.draggedElement.classList.remove('dragging');
            this.draggedElement = null;
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        const dropTarget = this.findDropTarget(event.target);
        if (!dropTarget || dropTarget === this.draggedElement) return;

        const dropTargetType = dropTarget.dataset.type;
        if (dropTargetType !== this.draggedElementType) return;

        this.updateDropTarget(dropTarget);
    }

    handleDrop(event) {
        event.preventDefault();

        const dropTarget = this.findDropTarget(event.target);
        if (!dropTarget || dropTarget === this.draggedElement) return;

        const draggedId = event.dataTransfer.getData('text/plain');
        const dropTargetId = dropTarget.dataset.id;

        if (this.onDrop) {
            const newIndex = Array.from(dropTarget.parentNode.children)
                .indexOf(dropTarget);
            this.onDrop(draggedId, dropTargetId, newIndex, this.draggedElementType);
        }
    }

    findDropTarget(element) {
        while (element && !element.dataset.id) {
            element = element.parentElement;
        }
        return element;
    }

    updateDropTarget(target) {
        const rect = target.getBoundingClientRect();
        const dropIndicator = document.createElement('div');
        dropIndicator.classList.add('drop-indicator');

        // Remove any existing drop indicators
        document.querySelectorAll('.drop-indicator').forEach(el => el.remove());

        target.parentNode.insertBefore(dropIndicator, target);
    }
} 