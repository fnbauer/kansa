import { Map } from 'immutable'
import React from 'react'
import Checkbox from 'material-ui/Checkbox';
import Divider from 'material-ui/Divider';
import MenuItem from 'material-ui/MenuItem';
import Paper from 'material-ui/Paper';
import SelectField from 'material-ui/SelectField';
import TextField from 'material-ui/TextField';
import ContentMail from 'material-ui/svg-icons/content/mail'

import { emptyPaperPubsMap, membershipTypes} from '../constants'

const styles = {
  changed: { borderColor: 'rgb(255, 152, 0)' },
}

export const TextInput = ({ getDefaultValue, getValue, inputRef, label, onChange, path, required, style = {}, ...props }) => {
  if (!Array.isArray(path)) path = [ path ];
  const value = getValue(path);
  if (value === null) return null;
  if (!label) {
    const ps = path.join(' ');
    label = ps.charAt(0).toUpperCase() + ps.slice(1).replace(/_/g, ' ');
  }
  const ulStyle = value === getDefaultValue(path) ? {} : styles.changed;
  return <TextField
    floatingLabelText={label}
    floatingLabelFixed={true}
    fullWidth={true}
    style={style}
    className='memberInput'
    underlineStyle={ulStyle}
    underlineFocusStyle={ulStyle}
    value={value}
    errorText={ !required || value ? '' : 'Required' }
    onChange={ ev => onChange(path, ev.target.value) }
    ref={ inputRef || (() => {}) }
    { ...props }
  />;
}
TextInput.propTypes = {
  getDefaultValue: React.PropTypes.func.isRequired,
  getValue: React.PropTypes.func.isRequired,
  onChange: React.PropTypes.func.isRequired
};

export const MembershipSelect = ({ getDefaultValue, getValue, onChange, prices, style }) => {
  const path = ['membership'];
  const prevMembership = getDefaultValue && getDefaultValue(path);
  const prevIdx = membershipTypes.indexOf(prevMembership);
  const prevAmount = prices && prevMembership && prices.getIn(['memberships', prevMembership, 'amount']) || 0;
  return <SelectField
    floatingLabelFixed={true}
    floatingLabelText='Membership type'
    onChange={ (ev, idx, value) => onChange(path, value) }
    style={style}
    value={ getValue(path) || 'NonMember' }
  >
    { membershipTypes.map((type, idx) => {
      if (type === 'NonMember' && prevMembership !== 'NonMember') return null;
      const amount = prices ? prices.getIn(['memberships', type, 'amount'], -100) : -100;
      const eurAmount = (amount - prevAmount) / 100;
      const label = prices && prices.getIn(['memberships', type, 'description']) || type;
      return <MenuItem
        key={type}
        disabled={ eurAmount < 0 || idx < prevIdx }
        value={type}
        primaryText={ eurAmount <= 0 ? label : `${label} (€${eurAmount})` }
      />
    }) }
  </SelectField>;
}

export const PaperPubsCheckbox = ({ getDefaultValue, getValue, onChange, prices, style }) => {
  const path = ['paper_pubs'];
  const eurAmount = prices ? prices.getIn(['PaperPubs', 'amount'], 0) / 100 : -1;
  return <Checkbox
    checkedIcon={<ContentMail />}
    style={style}
    label={`Add paper publications (€${eurAmount})`}
    checked={!!getValue(path)}
    disabled={!!getDefaultValue(path)}
    onCheck={ (ev, checked) => onChange(path, checked ? emptyPaperPubsMap : null) }
  />;
}

const AddressField = ({ field, hintText, multiLine=false, onChange, value }) => {
  return <TextField
    fullWidth={true}
    hintStyle={multiLine ? { bottom: 36 } : null}
    hintText={hintText}
    multiLine={multiLine}
    required={true}
    rows={multiLine ? 2 : 1}
    style={{ marginLeft: 16 }}
    underlineShow={false}
    value={value}
    onChange={ ev => onChange(['paper_pubs', field], ev.target.value) }
  />;
}

export const PaperPubsFields = ({ getDefaultValue, getValue, onChange }) => {
  const pp = getValue(['paper_pubs']);
  if (!Map.isMap(pp)) return null;
  const changed = !pp.equals(getDefaultValue(['paper_pubs']));
  const errorStyle = { outline: '1px solid red', outlineOffset: -1 };
  return <Paper
    style={ pp.some(v => !v) ? errorStyle : null }
    zDepth={1}
  >
    <AddressField
      field="name"
      hintText="Paper pubs name"
      onChange={onChange}
      value={pp.get('name')}
    />
    <Divider />
    <AddressField
      field="address"
      hintText="Paper pubs address"
      multiLine={true}
      onChange={onChange}
      value={pp.get('address')}
    />
    <Divider />
    <AddressField
      field="country"
      hintText="Paper pubs country"
      onChange={onChange}
      value={pp.get('country')}
    />
  </Paper>;
}
PaperPubsFields.propTypes = TextInput.propTypes;
