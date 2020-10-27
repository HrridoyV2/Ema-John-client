import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import axios from "./axios";
import React, { useEffect, useState } from "react";
import CurrencyFormat from "react-currency-format";
import { Link, useHistory } from "react-router-dom";
import "./Payment.css";
import { getBasketTotal } from "../../reducer";
import { useStateValue } from "../../StateProvider";
import { db } from "../Login/firebase";
import CheckoutProduct from "../PlaceOrder/CheckoutProduct/CheckoutProduct";

function Payment() {
  const [{ basket, user }, dispatch] = useStateValue();
  const history = useHistory();
  const stripe = useStripe();
  const elements = useElements();
  const [succeeded, setSucceeded] = useState(false);
  const [processing, setProcessing] = useState("");
  const [error, setError] = useState(null);
  const [disabled, setDisabled] = useState(true);
  const [clientSecret, setClientSecret] = useState(true);

  useEffect(() => {
    const getClientSecret = async () => {
      const response = await axios({
        method: "POST",
        url: `/payments/create?total=${Math.round(getBasketTotal(basket))}`,
      });
      setClientSecret(response.data.clientSecret);
    };
    getClientSecret();
  }, [basket]);

  console.log("THE SECRET IS >> ", clientSecret);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    const payload = await stripe
      .confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          // console.log(card)
        },
      })
      .then(({ paymentIntent }) => {
        const amount = paymentIntent.amount + "USD";
        const created = paymentIntent.created;
        //  paymentIntent = payment confirmation
        db.collection("users")
          .doc(user?.uid)
          .collection("orders")
          .doc(paymentIntent.id)
          .set({
            basket: basket,
            amount: paymentIntent.amount,
            created: paymentIntent.created,
          });

        setSucceeded(true);
        setError(null);
        setProcessing(false);

        const orderDetails = {
          user,
          basket,
          amount,
          created,
          email: user.email,
        };
        fetch("https://limitless-hamlet-24521.herokuapp.com/addOrder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderDetails),
        })
          .then((res) => res.json())
          .then((success) => {
            if (success) {
              alert("Order PLaced successfully");
              history.replace("/orders");
            }
          });
        dispatch({
          type: "EMPTY_BASKET",
        });
        // const orderDetails = {basket}
      });
  };
  const handleChange = (event) => {
    //Listen for change in the CardElement
    //and display any errors as the customer types their card details
    setDisabled(event.emty);
    setError(event.error ? event.error.message : "");
  };
  return (
    <div className="payment">
      <div className="payment__container">
        <h1>Checkout ({<Link to="/checkout">{basket?.length} items</Link>})</h1>
        {/* Payment section - delivery address */}

        <div className="payment__section">
          <div className="payment__title">
            <h3>Delivery Address </h3>
          </div>
          <div className="payment__address">
            <p>{user?.email}</p>
            <p>132 React Lane</p>
            <p>Los Angeles, CA</p>
          </div>
        </div>
        {/* Payment section - Review Items */}
        <div className="payment__section">
          <div className="payment__title">
            <h3>Review Items and delivery</h3>
          </div>
          <div className="payment__items">
            {basket.map((item) => (
              <CheckoutProduct
                id={item.id}
                title={item.title}
                image={item.image}
                price={item.price}
                rating={item.rating}
              />
            ))}
          </div>
        </div>
        {/* Payment section - payment method */}
        <div className="payment__section">
          <div className="payment__title">
            <h3>Mayment Method</h3>
          </div>
          <div className="payment__details">
            {/* Stripe magic will go here */}
            <form onSubmit={handleSubmit}>
              <CardElement onChange={handleChange} />
              <div className="payment__priceContainer">
                <CurrencyFormat
                  renderText={(value) => (
                    <>
                      <h3>Order Total: {value}</h3>
                    </>
                  )}
                  decimalScale={2}
                  value={getBasketTotal(basket)}
                  displayType={"text"}
                  thousandsSeparator={true}
                  prefix={"$"}
                />
                <button disabled={processing || disabled || succeeded}>
                  <span>{processing ? <p>Processing</p> : "Buy Now"}</span>
                </button>
              </div>
              {/* Errors */}
              {error && <div>{error}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;