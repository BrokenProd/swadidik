const LoadingHolder = () => {
    return <div className="size-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-xl font-semibold">Loading Workspace...</p>
        </div>
    </div>
}

export default LoadingHolder
