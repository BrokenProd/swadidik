import Workspace from "#/components/Workspace";

function WorkspacePage() {
    const uuid = new URLSearchParams(window.location.search).get("uuid");

    if (!uuid) {
        return <div className="flex h-screen items-center justify-center">
            A workspace ID is required.
        </div>;
    }

    return (
        <div className="w-screen h-screen">
            <Workspace uuid={uuid} />
        </div>
    );
}

export default WorkspacePage;
