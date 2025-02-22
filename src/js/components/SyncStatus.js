// Sync status indicator component
class SyncStatus extends Component {
    constructor(element, options = {}) {
        super(element, options);
        this.firebaseService = options.firebaseService;
    }

    async setupState() {
        this._state = {
            status: Constants.UI.SYNC_STATES.OFFLINE,
            lastSynced: null
        };
    }

    async setupEventListeners() {
        // Listen for sync status changes
        this.firebaseService.on(Constants.EVENTS.SYNC_STATUS, (status) => {
            this.setState({
                status,
                lastSynced: status === Constants.UI.SYNC_STATES.ONLINE ? new Date() : this._state.lastSynced
            });
        });
    }

    async render() {
        const { status, lastSynced } = this.getState();
        const statusClass = `sync-status--${status.toLowerCase()}`;
        const lastSyncedText = lastSynced ?
            `Last synced: ${this.formatLastSynced(lastSynced)}` :
            'Never synced';

        this.element.className = `sync-status ${statusClass}`;
        this.element.innerHTML = `
            <div class="sync-status__indicator"></div>
            <div class="sync-status__text">
                <span class="sync-status__state">${this.getStatusText(status)}</span>
                <span class="sync-status__time">${lastSyncedText}</span>
            </div>
        `;
    }

    getStatusText(status) {
        switch (status) {
            case Constants.UI.SYNC_STATES.ONLINE:
                return 'Synced';
            case Constants.UI.SYNC_STATES.OFFLINE:
                return 'Offline';
            case Constants.UI.SYNC_STATES.ERROR:
                return 'Sync Error';
            case Constants.UI.SYNC_STATES.SYNCING:
                return 'Syncing...';
            default:
                return 'Unknown';
        }
    }

    formatLastSynced(date) {
        const now = new Date();
        const diff = now - date;

        if (diff < 1000) {
            return 'just now';
        } else if (diff < 60000) {
            return `${Math.floor(diff / 1000)}s ago`;
        } else if (diff < 3600000) {
            return `${Math.floor(diff / 60000)}m ago`;
        } else if (diff < 86400000) {
            return `${Math.floor(diff / 3600000)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    removeEventListeners() {
        // Event listeners are handled by the service's event system
    }
}

// Make globally available
window.SyncStatus = SyncStatus; 