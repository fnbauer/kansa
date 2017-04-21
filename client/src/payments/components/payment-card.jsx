import React, { PropTypes } from 'react'
const ImmutablePropTypes = require('react-immutable-proptypes');

import { Card, CardActions, CardHeader, CardText } from 'material-ui/Card'
import FlatButton from 'material-ui/FlatButton'
import Divider from 'material-ui/Divider'

import { API_ROOT } from '../../constants'
import * as PaymentPropTypes from '../proptypes'

const PaymentActions = ({ person_id, type, userIds }) => {
  switch (type) {
    case 'ss-token':
      return person_id && userIds && userIds.includes(person_id) ? (
        <CardActions style={{ display: 'flex' }}>
          <FlatButton
            href={`${API_ROOT}kansa/people/${person_id}/ballot`}
            label="Download personal ballot"
            primary={true}
            target="_blank"
          />
        </CardActions>
      ) : null;
  }
  return null;
}

const PaymentCard = ({ label, purchase, shape, userIds }) => {
  const {
    amount, category, comments, data, invoice, paid, payment_email,
    person_id, person_name, stripe_charge_id, type
  } = purchase.toJS();
  const subtitle = category !== label ? category : '';
  return <Card
    style={{ marginBottom: 18 }}
  >
    <CardHeader
      style={{ display: 'flex', fontWeight: 600 }}
      title={label}
      subtitle={subtitle}
    >
      <div style={{ flexGrow: 1, textAlign: 'right' }}>
        <div
          style={{ color: 'rgba(0, 0, 0, 0.870588)', fontSize: 15 }}
        >
          €{amount / 100}<br/>
        </div>
        {paid ? <div
          style={{ color: 'rgba(0, 0, 0, 0.541176)', fontSize: 14 }}
          title={paid}
        >
          {paid.slice(0, paid.indexOf('T'))}
        </div> : null}
      </div>
    </CardHeader>
    <CardText style={{ paddingTop: 0 }}>
      <table style={{ margin: 0, width: '100%' }}><tbody>
        <tr>
          <td>Payment from:</td>
          <td>{payment_email}</td>
        </tr>
        <tr>
          <td>Payment for:</td>
          <td>{person_name}</td>
        </tr>
        <tr>
          <td>Charge id:</td>
          <td style={{ fontFamily: 'monospace' }}>{stripe_charge_id}</td>
        </tr>
        {invoice ? <tr>
          <td>Invoice:</td>
          <td>{invoice}</td>
        </tr> : null}
        <tr><td colSpan="2" style={{ paddingTop: 6, paddingBottom: 4 }}><Divider /></td></tr>
        {Object.keys(data).filter(key => data[key]).map((key) => (
          <tr key={key}>
            <td>{shape && shape.getIn([key, 'label']) || key}:</td>
            <td>{data[key]}</td>
          </tr>
        ))}
        {comments ? <tr>
          <td>Comments:</td>
          <td>{comments}</td>
        </tr> : null}
      </tbody></table>
    </CardText>
    <PaymentActions person_id={person_id} type={type} userIds={userIds} />
  </Card>;
};

PaymentCard.propTypes = {
  label: PropTypes.string.isRequired,
  purchase: PaymentPropTypes.purchase.isRequired,
  shape: PaymentPropTypes.shape,
  userIds: ImmutablePropTypes.listOf(PropTypes.number)
}

export default PaymentCard;
