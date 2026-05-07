function BackendStatus({ status }) {
	const labels = {
		loading: 'Checking',
		online: 'Online',
		offline: 'Offline',
	};

	return (
		<span className={`backend-status backend-status--${status || 'loading'}`}>
			<span aria-hidden="true" />
			{labels[status] || labels.loading}
		</span>
	);
}

export default BackendStatus;
