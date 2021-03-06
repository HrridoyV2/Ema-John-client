import React from 'react';
import CurrencyFormat from "react-currency-format";
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getBasketTotal } from '../../../redux/basket/basketReducer';
import './Subtotal.css';
function Subtotal() {
  const history = useHistory();
  const products = useSelector((store) => store.basket.basket.slice(1, store.basket.basket.length))
  
  
    return (
      <div className="subtotal">
        <CurrencyFormat
          renderText={(value) => (
            <>
              <p>
                Subtotal ({products.length} items): <strong>{value}</strong>
              </p>
              <small className="subtotal__gift">
                <input type="checkbox" /> This order contains a gift
              </small>
            </>
          )}
          decimalScale={2}
          value={getBasketTotal
            (products)}
          displayType={"text"}
          thousandsSeparator={true}
          prefix={"$"}
        />
        <button onClick={e => history.push("/payment")}>Proceed to Checkout</button>
      </div>
    );
}

export default Subtotal
