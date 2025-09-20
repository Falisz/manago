import React from 'react';
import Icon from "./Icon";

const Checkbox = ({
                      className,
                      id,
                      style,
                      name,
                      label,
                      checked=false,
                      disabled,
                      onChange,
                  }) => {

    const handleCheck = () => {
        checked = !checked;
        const syntheticEvent = {
            target: { name, type: 'checkbox', checked },
            // eslint-disable-next-line
            persist: () => {}, // For React event pooling compatibility
        };
        onChange(syntheticEvent);
    }

    return (
      <div
          id = {id}
          className={'app-checkbox'
              + (checked ? ' checked' : '' )
              + (disabled ? ' disabled' : '')
              + (className ? ' ' + className : '')}
          tabIndex={0}
          style={style}
          onClick={handleCheck}
          onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                  handleCheck();
              }
          }}
      >
          <div className={'app-checkbox-tick'}>{checked && <Icon i={'check'} s={true} clickable={true}/>}</div>
          {label && <div className={'app-checkbox-label'}>{label}</div>}
      </div>
    );

}

export default Checkbox;