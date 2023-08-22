const FormTextInput = ({
  title,
  id,
  value,
  placeholder = '',
  monospace = false,
  disabled = false,
  isPassword = false,
  required = false,
  setValue,
  onFocus,
  onBlur,
  onKeyDown,
}: {
  title?: string;
  id?: string;
  placeholder?: string;
  monospace?: boolean;
  disabled?: boolean;
  isPassword?: boolean;
  required?: boolean;
  value: string;
  setValue: any;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: any) => void;
}) => {
  if (!id && !title) {
    throw new Error('Neither title nor id are set in FormTextInput!');
  }

  return (
    <div className="mb-3 fs-5">
      {title && (
        <label htmlFor={id} className="form-label">
          {title}
        </label>
      )}
      <input
        type={isPassword ? 'password' : 'text'}
        id={id || title}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={(e: any) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className={'form-control' + (monospace ? ' font-monospace' : '')}
      />
    </div>
  );
};

export default FormTextInput;
