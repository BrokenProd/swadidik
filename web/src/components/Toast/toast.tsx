import {
  ToastContainer as ReactToastifyContainer,
  toast as notify,
  type ToastOptions,
  type Id,
  type TypeOptions,
} from "react-toastify";

type ToastFireInput =
  | string
  | {
      title?: string;
      text?: string;
      icon?: TypeOptions;
    };

const resolvePayload = (
  input?: ToastFireInput,
): { message: string; options?: ToastOptions } => {
  if (typeof input === "string") {
    return { message: input };
  }

  if (!input) {
    return { message: "" };
  }

  const message = input.title ?? input.text ?? "";
  const options: ToastOptions = {};
  if (input.icon) {
    options.type = input.icon;
  }

  return { message, options };
};

const fire = (input?: ToastFireInput) => {
  const { message, options } = resolvePayload(input);
  return notify(message, options);
};

const loading = (input?: ToastFireInput) => {
  const { message, options } = resolvePayload(input);
  return notify.loading(message, options);
};

const update = (id: Id, input?: ToastFireInput, options?: ToastOptions) => {
  const { message, options: resolvedOptions } = resolvePayload(input);
  notify.update(id, {
    render: message,
    isLoading: false,
    ...resolvedOptions,
    ...options,
  });
};

const close = () => notify.dismiss();

const Toast = { fire, loading, update, close };

export const ToastContainer = () => (
  <ReactToastifyContainer
    position="bottom-right"
    newestOnTop
    closeOnClick
    pauseOnHover
    draggable
    theme="colored"
  />
);

export default Toast;
